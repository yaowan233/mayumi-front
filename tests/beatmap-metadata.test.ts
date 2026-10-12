import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, request as httpRequest } from "node:http";
import { createConnection } from "node:net";
import test from "node:test";
import type { Dispatcher1Wrapper } from "undici";
import { createMetadataLoader, loadBeatmapMetadata } from "../lib/beatmap-metadata.ts";

test("official metadata is batched, validated and cached", async () => {
    const previousId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const previousSecret = process.env.CLIENT_SECRET;
    process.env.NEXT_PUBLIC_CLIENT_ID = "test-id";
    process.env.CLIENT_SECRET = "test-secret";
    try {
        let calls = 0;
        const loader = createMetadataLoader(async input => {
            calls++;
            if (String(input).endsWith("/oauth/token")) return Response.json({ access_token: "test-token", expires_in: 3600 });
            assert.deepEqual(new URL(String(input)).searchParams.getAll("ids[]"), ["42", "43"]);
            return Response.json({ beatmaps: [
                { id: 42, beatmapset_id: 100, version: "Rain", beatmapset: { title: "Song", artist: "Artist" }, difficulty_rating: 99 },
                { id: 43, beatmapset_id: -1 },
                { id: 99, beatmapset_id: 100, version: "Other", beatmapset: { title: "Other", artist: "Other" } },
            ] });
        });
        const result = await loader([42, 42, 43, -1]);
        assert.deepEqual(result.get(42), { title: "Song", artist: "Artist", version: "Rain", beatmapset_id: 100 });
        assert.equal(result.size, 1);
        assert.deepEqual(await loader([42, 43]), result);
        assert.equal(calls, 2);
    } finally {
        if (previousId === undefined) delete process.env.NEXT_PUBLIC_CLIENT_ID; else process.env.NEXT_PUBLIC_CLIENT_ID = previousId;
        if (previousSecret === undefined) delete process.env.CLIENT_SECRET; else process.env.CLIENT_SECRET = previousSecret;
    }
});

test("metadata failure preserves recommendations and has a short negative cache", async () => {
    let calls = 0;
    const loader = createMetadataLoader(async () => { calls++; throw new Error("offline"); });
    assert.equal((await loader([42])).size, 0);
    const firstCalls = calls;
    assert.equal((await loader([42])).size, 0);
    assert.equal(calls, firstCalls);
});

test("metadata OAuth and beatmap requests work through an Undici 8 proxy with native fetch", async t => {
    const origin = createServer((request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(request.url === "/oauth/token"
            ? { access_token: "test-token", expires_in: 3600 }
            : { beatmaps: [{ id: 4242, beatmapset_id: 100, version: "Rain", beatmapset: { title: "Song", artist: "Artist" } }] }));
    });
    let forwarded = 0;
    const proxy = createServer((request, response) => {
        forwarded++;
        const upstream = httpRequest(new URL(request.url!), {
            method: request.method,
            headers: request.headers,
        }, upstreamResponse => {
            response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
            upstreamResponse.pipe(response);
        });
        upstream.on("error", () => response.destroy());
        request.pipe(upstream);
    });
    let tunnels = 0;
    proxy.on("connect", (request, client, head) => {
        tunnels++;
        const target = new URL(`http://${request.url}`);
        const upstream = createConnection(Number(target.port), target.hostname, () => {
            client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
            if (head.length) upstream.write(head);
            client.pipe(upstream);
            upstream.pipe(client);
        });
        upstream.on("error", () => client.destroy());
        client.on("error", () => upstream.destroy());
        client.on("close", () => upstream.destroy());
    });
    const previousEnv = {
        NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET,
        OSU_METADATA_PROXY_URL: process.env.OSU_METADATA_PROXY_URL,
    };
    let dispatcher: Dispatcher1Wrapper | undefined;
    try {
        origin.listen(0, "127.0.0.1");
        await once(origin, "listening");
        proxy.listen(0, "127.0.0.1");
        await once(proxy, "listening");
        const originAddress = origin.address();
        const proxyAddress = proxy.address();
        assert.ok(originAddress && typeof originAddress === "object");
        assert.ok(proxyAddress && typeof proxyAddress === "object");
        process.env.NEXT_PUBLIC_CLIENT_ID = "test-id";
        process.env.CLIENT_SECRET = "test-secret";
        process.env.OSU_METADATA_PROXY_URL = `http://127.0.0.1:${proxyAddress.port}`;
        const nativeFetch = globalThis.fetch;
        const paths: string[] = [];
        t.mock.method(globalThis, "fetch", (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
            const path = new URL(String(input)).pathname;
            paths.push(path);
            dispatcher = (init as RequestInit & { dispatcher: Dispatcher1Wrapper }).dispatcher;
            return nativeFetch(`http://127.0.0.1:${originAddress.port}${path}`, init);
        });
        const metadata = await loadBeatmapMetadata([4242]);
        assert.deepEqual(metadata.get(4242), { title: "Song", artist: "Artist", version: "Rain", beatmapset_id: 100 });
        assert.deepEqual(paths, ["/oauth/token", "/api/v2/beatmaps"]);
        assert.ok(tunnels + forwarded > 0);
    } finally {
        t.mock.restoreAll();
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
        await dispatcher?.close();
        origin.closeAllConnections();
        await Promise.all([
            new Promise<void>(resolve => origin.close(() => resolve())),
            new Promise<void>(resolve => proxy.close(() => resolve())),
        ]);
    }
});
