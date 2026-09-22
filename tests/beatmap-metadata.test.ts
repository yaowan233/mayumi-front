import assert from "node:assert/strict";
import test from "node:test";
import { createMetadataLoader } from "../lib/beatmap-metadata.ts";

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
