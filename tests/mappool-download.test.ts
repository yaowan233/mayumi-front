import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import {downloadBeatmapset, DOWNLOAD_MIRRORS} from '../lib/mappool-download.ts';

async function archive(name = 'map.osu') {
    return new JSZip().file(name, 'osu file format v14').generateAsync({type: 'arraybuffer'});
}

test('failed mirror switches to a valid archive and stops requesting', async () => {
    const valid = await archive();
    const urls: string[] = [];
    const result = await downloadBeatmapset('123', {fetcher: async input => {
        urls.push(String(input));
        return urls.length === 1 ? new Response('limited', {status: 429}) : new Response(valid);
    }});
    assert.deepEqual(result, valid);
    assert.equal(urls.length, 2);
    assert.match(urls[0], /osu.direct/);
    assert.match(urls[1], /sayobot/);
});

test('HTML, a zip without beatmaps, and corrupted zip all trigger fallback', async () => {
    const valid = await archive();
    const corrupt = new Uint8Array(valid.slice(0));
    const start = Buffer.from(corrupt).indexOf('osu file format');
    corrupt[start] ^= 1;
    for (const invalid of [new Response('<html>upstream failure</html>'), new Response(await archive('error.txt')), new Response(corrupt)]) {
        const responses = [invalid, new Response(valid)];
        assert.deepEqual(await downloadBeatmapset('123', {fetcher: async () => responses.shift()!}), valid);
        assert.equal(responses.length, 0);
    }
});

test('timeout while reading the body aborts the source and tries the next mirror', async () => {
    const valid = await archive();
    let calls = 0;
    let aborted = false;
    const result = await downloadBeatmapset('123', {timeoutMs: 20, fetcher: async (_url, init) => {
        if (++calls > 1) return new Response(valid);
        return new Response(new ReadableStream({start(controller) {
            init!.signal!.addEventListener('abort', () => {
                aborted = true;
                controller.error(new Error('aborted'));
            });
        }}));
    }});
    assert.equal(aborted, true);
    assert.equal(calls, 2);
    assert.deepEqual(result, valid);
});

test('preferred source is first and network/CORS failures fall back', async () => {
    const valid = await archive();
    const urls: string[] = [];
    await downloadBeatmapset('123', {preferred: 'beatconnect', fetcher: async input => {
        urls.push(String(input));
        if (urls.length === 1) throw new TypeError('Failed to fetch');
        return new Response(valid);
    }});
    assert.equal(urls[0], '/downloads/beatmapsets/123');
    assert.match(urls[1], /osu.direct/);
});

test('all sources failing produces a failure summary, never a bogus osz', async () => {
    let count = 0;
    await assert.rejects(downloadBeatmapset('123', {fetcher: async () => {
        count++;
        return new Response('', {status: 404});
    }}), /所有镜像均下载失败[\s\S]*osu.direct:[\s\S]*小夜:[\s\S]*Beatconnect:/);
    assert.equal(count, DOWNLOAD_MIRRORS.length);
});

test('invalid IDs never issue requests', async () => {
    for (const id of ['0', '-1', '1/path', '9007199254740992']) {
        await assert.rejects(downloadBeatmapset(id, {fetcher: async () => {throw new Error('unexpected request');}}), /无效的谱面集/);
    }
});
