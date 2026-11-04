import assert from "node:assert/strict";
import test from "node:test";
import {ApiRequestError, browserResourceKey, fetchBrowserJson, fetchCurrentUser} from "../lib/client-api.ts";

test("browser requests retain HttpOnly session cookies and bypass HTTP caches", async () => {
    const original = globalThis.fetch;
    try {
        globalThis.fetch = async (url, options) => {
            assert.equal(url, "https://mayumi.example/api/me");
            assert.equal(options?.credentials, "include");
            assert.equal(options?.cache, "no-store");
            assert.ok(options?.signal);
            assert.equal(options?.headers, undefined);
            return Response.json({uid: 123, name: "Player", playmode: "mania"});
        };
        assert.deepEqual(await fetchCurrentUser("https://mayumi.example/api/me"), {uid: 123, name: "Player", playmode: "mania"});
    } finally {globalThis.fetch = original;}
});

test("expired login is anonymous but server and network failures remain errors", async () => {
    const original = globalThis.fetch;
    try {
        for (const status of [401, 403]) {
            globalThis.fetch = async () => new Response("private auth details", {status});
            assert.equal(await fetchCurrentUser("/api/me"), null);
        }
        globalThis.fetch = async () => new Response("upstream internal details", {status: 503});
        await assert.rejects(fetchCurrentUser("/api/me"), (error: unknown) => error instanceof ApiRequestError && error.status === 503 && !error.message.includes("internal details"));
        globalThis.fetch = async () => {throw new TypeError("network unavailable");};
        await assert.rejects(fetchCurrentUser("/api/me"), /network unavailable/);
        for (const value of [null, {}, {uid: 0}, {uid: "123"}]) {
            globalThis.fetch = async () => Response.json(value);
            assert.equal(await fetchCurrentUser("/api/me"), null);
        }
    } finally {globalThis.fetch = original;}
});

test("failed page fetches cannot render backend error payloads as successful data", async () => {
    const original = globalThis.fetch;
    try {
        globalThis.fetch = async () => new Response('{"detail":"private information"}', {status: 403});
        await assert.rejects(fetchBrowserJson("/api/scores?preview=true"), (error: unknown) => error instanceof ApiRequestError && error.status === 403 && !error.message.includes("private information"));
        globalThis.fetch = async () => new Response("<html>upstream details</html>");
        await assert.rejects(fetchBrowserJson("/api/stats"), /数据格式异常/);
    } finally {globalThis.fetch = original;}
});

test("page cache waits for authentication and separates users, anonymous and preview data", () => {
    const url = "/api/scores?tournament_name=Cup";
    assert.equal(browserResourceKey(url, undefined, true), null);
    assert.notDeepEqual(browserResourceKey(url, undefined, false), browserResourceKey(url, 123, false));
    assert.notDeepEqual(browserResourceKey(url, 123, false), browserResourceKey(url, 456, false));
    assert.notDeepEqual(browserResourceKey(url, 123, false), browserResourceKey(url + "&preview=true", 123, false));
});
