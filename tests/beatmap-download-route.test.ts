import assert from 'node:assert/strict';
import test from 'node:test';
import {GET} from '../app/downloads/beatmapsets/[id]/route.ts';

const request = () => new Request('https://mayumi.xyz/downloads/beatmapsets/123');

test('proxy validates IDs before accessing the upstream', async t => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('unexpected'); });
    for (const id of ['0', '../123', 'https://example.com', '9007199254740992']) {
        assert.equal((await GET(request(), {params: Promise.resolve({id})})).status, 400);
    }
    assert.equal(fetch.mock.callCount(), 0);
});

test('proxy streams a fixed mirror without forwarding cookies or upstream headers', async t => {
    t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
        assert.equal(url, 'https://beatconnect.io/b/123/');
        assert.equal(init?.credentials, 'omit');
        assert.equal(init?.cache, 'no-store');
        assert.equal(init?.headers, undefined);
        assert.ok(init?.signal);
        return new Response(new Uint8Array([80, 75, 3, 4]), {headers: {'Set-Cookie': 'unwanted', 'Content-Type': 'application/octet-stream'}});
    });
    const response = await GET(request(), {params: Promise.resolve({id: '123'})});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([80, 75, 3, 4]));
});

test('proxy reports missing maps, upstream errors, HTML and connection failures', async t => {
    const cases = [[404, 'application/json', 404], [503, 'text/plain', 502], [200, 'text/html', 502]] as const;
    for (const [status, contentType, expected] of cases) {
        const mock = t.mock.method(globalThis, 'fetch', async () => new Response('error', {status, headers: {'Content-Type': contentType}}));
        assert.equal((await GET(request(), {params: Promise.resolve({id: '123'})})).status, expected);
        mock.mock.restore();
    }
    t.mock.method(globalThis, 'fetch', async () => {throw new TypeError('network');});
    assert.equal((await GET(request(), {params: Promise.resolve({id: '123'})})).status, 502);
});

test('client cancellation reaches the upstream request', async t => {
    const controller = new AbortController();
    controller.abort();
    t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
        assert.equal(init?.signal?.aborted, true);
        throw new Error('aborted');
    });
    const response = await GET(new Request(request(), {signal: controller.signal}), {params: Promise.resolve({id: '123'})});
    assert.equal(response.status, 502);
});
