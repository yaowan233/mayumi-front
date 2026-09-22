import assert from "node:assert/strict";
import test from "node:test";
import { verifyRecommendationSession } from "../lib/recommendation-session.ts";

test("anonymous and malformed sessions never contact upstream", async () => {
    const fetcher: typeof fetch = async () => { throw new Error("must not fetch"); };
    for (const uuid of [undefined, "", "x;admin=true", "x\r\nInjected: yes"]) {
        assert.deepEqual(await verifyRecommendationSession(uuid, "https://backend.example", fetcher), { status: "unauthorized" });
    }
});

test("session is verified against the backend without caching or redirects", async () => {
    const fetcher: typeof fetch = async (url, options) => {
        assert.equal(url, "https://backend.example/api/me");
        assert.deepEqual(options?.headers, { Cookie: "uuid=test-session" });
        assert.equal(options?.cache, "no-store");
        assert.equal(options?.redirect, "error");
        assert.ok(options?.signal);
        return Response.json({ uid: 123, name: "Player" });
    };
    assert.deepEqual(await verifyRecommendationSession("test-session", "https://backend.example/", fetcher), { status: "authenticated", uid: 123, defaultMode: "osu" });
});

test("authenticated player's preferred mode drives recommendation defaults", async () => {
    for (const playmode of ["osu", "taiko", "fruits", "mania"]) {
        const session = await verifyRecommendationSession("test-session", "https://backend.example",
            async () => Response.json({ uid: 123, playmode }));
        assert.deepEqual(session, { status: "authenticated", uid: 123, defaultMode: playmode });
    }
});

test("missing or invalid preferred mode safely falls back to osu", async () => {
    for (const playmode of [null, "unknown", 3, {}, ["mania"]]) {
        const session = await verifyRecommendationSession("test-session", "https://backend.example",
            async () => Response.json({ uid: 123, playmode }));
        assert.deepEqual(session, { status: "authenticated", uid: 123, defaultMode: "osu" });
    }
});

test("invalid or expired sessions fail closed even with a cookie", async () => {
    for (const status of [401, 403]) {
        assert.deepEqual(await verifyRecommendationSession("test-session", "https://backend.example", async () => Response.json({ uid: 123 }, { status })), { status: "unauthorized" });
    }
    for (const body of [null, { error: "expired" }, { uid: 0 }, { uid: "123" }, { uid: -1 }]) {
        assert.deepEqual(await verifyRecommendationSession("test-session", "https://backend.example", async () => Response.json(body)), { status: "unauthorized" });
    }
});

test("authentication outages do not permit recommendation access", async () => {
    assert.deepEqual(await verifyRecommendationSession("test-session", "https://backend.example", async () => new Response(null, { status: 500 })), { status: "unavailable" });
    assert.deepEqual(await verifyRecommendationSession("test-session", "https://backend.example", async () => { throw new Error("offline"); }), { status: "unavailable" });
});
