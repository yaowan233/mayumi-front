import assert from "node:assert/strict";
import test from "node:test";
import {expandMatchPossibilities} from "../lib/schedule_possibilities.ts";

test("each candidate card gets its actual participant avatar and independent time", () => {
    const a = {name: "A", uid: [1], avatar_url: "https://a.ppy.sh/1"};
    const b = {name: "B", uid: [2], avatar_url: "https://a.ppy.sh/2"};
    const c = {name: "C", uid: [3], avatar_url: "https://a.ppy.sh/3"};
    const match = {datetime: null, team1: a, team2: null, possible_pairings: [
        {team1: "A", team2: "B", team1_info: a, team2_info: b, match_time: "2026-10-17T10:00:00Z"},
        {team1: "A", team2: "C", team1_info: a, team2_info: c, match_time: "2026-10-17T12:00:00Z"},
    ]};
    const cards = expandMatchPossibilities([match]);
    assert.deepEqual(cards.map(card => card.team2), [b, c]);
    assert.deepEqual(cards.map(card => card.datetime), match.possible_pairings.map(pair => pair.match_time));
    assert.equal(match.team2, null);
});

test("known second seat and unknown placeholders survive missing candidate metadata", () => {
    const b = {name: "B", uid: [2], avatar_url: "https://a.ppy.sh/2"};
    const match = {datetime: "2026-10-17T10:00:00Z", team1: null, team2: b,
        possible_pairings: [{team1: "A", team2: "B", match_time: null}]};
    const [card] = expandMatchPossibilities([match]);
    assert.equal(card.team1, null);
    assert.equal(card.team2, b);
    assert.equal(card.datetime, null);
    const future = {...match, possible_pairings: []};
    assert.equal(expandMatchPossibilities([future])[0], future);
});
