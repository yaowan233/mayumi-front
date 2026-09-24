import assert from "node:assert/strict";
import test from "node:test";
import {parseLeaderboardResponse} from "../lib/leaderboard-response.ts";

test("CNCC S3 group tiebreaker null response has no leaderboard rows", () => {
    assert.deepEqual(parseLeaderboardResponse(null), []);
});

test("preserves leaderboard rows and empty arrays", () => {
    const rows = [{name: "Player", Rating: 1.5, "平均排名": 2}];
    assert.deepEqual(parseLeaderboardResponse(rows), rows);
    assert.deepEqual(parseLeaderboardResponse([]), []);
});

test("rejects unexpected response types instead of hiding errors", () => {
    for (const value of [{detail: "failure"}, "null", 0, undefined]) {
        assert.throws(() => parseLeaderboardResponse(value), /无效的数据格式/);
    }
});
