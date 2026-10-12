import assert from "node:assert/strict";
import test from "node:test";
import {expandMatchPossibilities, sortSchedulesByTime} from "../lib/schedule_possibilities.ts";
import {getPairingTime} from "../lib/schedule_options.ts";

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

test("loser matches sort by each expanded candidate time across different matches", () => {
    const matches = [
        {match_id: "actual", is_winner_bracket: false, datetime: "2026-10-17T12:00:00Z", team1: null, team2: null},
        {match_id: "candidate", is_winner_bracket: false, datetime: null, team1: null, team2: null,
            possible_pairings: [
                {team1: "A", team2: "B", match_time: "2026-10-17T14:00:00Z"},
                {team1: "A", team2: "C", match_time: "2026-10-17T10:00:00Z"},
            ]},
    ];
    const cards = expandMatchPossibilities(matches).filter(match => !match.is_winner_bracket);
    assert.deepEqual(cards.map(card => card.datetime), [
        "2026-10-17T10:00:00Z", "2026-10-17T12:00:00Z", "2026-10-17T14:00:00Z",
    ]);
    assert.equal(matches[0].match_id, "actual");
    assert.equal(matches[1].possible_pairings?.[0].team2, "B");
});

test("time sorting compares instants, preserves ties and puts unset or invalid times last", () => {
    const items = [
        {id: "unset", time: null},
        {id: "offset", time: "2026-10-17T18:00:00+08:00"},
        {id: "earlier", time: "2026-10-17T09:00:00Z"},
        {id: "legacy-tie", time: "2026-10-17 10:00:00"},
        {id: "invalid", time: "invalid"},
    ];
    assert.deepEqual(sortSchedulesByTime(items, item => item.time).map(item => item.id),
        ["earlier", "offset", "legacy-tie", "unset", "invalid"]);
    assert.equal(items[0].id, "unset");
});

test("management sorting uses each saved candidate time and retains original edit indices", () => {
    const ab = {team1: "A", team2: "B", match_time: "2026-10-17T14:00:00Z"};
    const ac = {team1: "A", team2: "C", match_time: "2026-10-17T10:00:00Z"};
    const schedule = {match_time: null, possible_match_times: [
        {...ab, match_time: "2026-10-17T09:00:00Z"}, ac,
    ]};
    const cards = [
        {schedule, possiblePairing: ac, originalIndex: 4},
        {schedule, possiblePairing: ab, originalIndex: 4},
        {schedule: {match_time: "2026-10-17T09:30:00Z"}, possiblePairing: undefined, originalIndex: 2},
    ];
    const sorted = sortSchedulesByTime(cards, card => card.possiblePairing
        ? getPairingTime(card.schedule, card.possiblePairing) : card.schedule.match_time);
    assert.deepEqual(sorted.map(card => card.originalIndex), [4, 2, 4]);
    assert.equal(sorted[0].possiblePairing, ab);
});
