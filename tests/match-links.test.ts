import assert from "node:assert/strict";
import test from "node:test";
import {getMatchUrlError, normalizeMatchUrls} from "../lib/match-links.ts";

test("accepts modern and legacy MP room links, including query strings and fragments", () => {
    for (const url of ["https://osu.ppy.sh/community/matches/123", "https://osu.ppy.sh/mp/123", "https://osu.ppy.sh/community/matches/123/?foo=bar#events", "https://osu.ppy.sh/mp/123#events"]) {
        assert.equal(getMatchUrlError(url), null);
    }
});

test("rejects beatmaps, unrelated hosts, malformed room IDs and extra path segments", () => {
    for (const url of ["https://osu.ppy.sh/b/4692822", "https://osu.ppy.sh/beatmapsets/123#osu/4692822", "https://osu.ppy.sh/community/matches/0", "https://osu.ppy.sh/mp/-1", "https://osu.ppy.sh/mp/123abc", "https://osu.ppy.sh/mp/123/other", "https://osu.ppy.sh.evil.test/mp/123", "https://osu.ppy.sh@evil.test/mp/123", "http://osu.ppy.sh/mp/123", "123", "https://osu.ppy.sh/mp/１２３"]) {
        assert.match(getMatchUrlError(url) ?? "", /MP 房间链接/);
        assert.throws(() => normalizeMatchUrls(["https://osu.ppy.sh/mp/1", url]), /MP 房间链接/);
    }
});

test("blank inputs stay optional and saving trims and deduplicates links", () => {
    assert.equal(getMatchUrlError("  "), null);
    assert.deepEqual(normalizeMatchUrls(null), []);
    assert.deepEqual(normalizeMatchUrls(["", "  ", " https://osu.ppy.sh/mp/123 ", "https://osu.ppy.sh/mp/123"]), ["https://osu.ppy.sh/mp/123"]);
});
