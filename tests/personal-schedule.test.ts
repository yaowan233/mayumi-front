import assert from "node:assert/strict";
import test from "node:test";
import {partitionMyMatches} from "../lib/personal-schedule.ts";
import {expandMatchPossibilities} from "../lib/schedule_possibilities.ts";

const a = {name: "Alice", uid: [1], avatar_url: "a"};
const b = {name: "Bob", uid: [2], avatar_url: "b"};

test("solo matches are separated once without changing either group's order", () => {
    const matches = [
        {id: "other1", team1: b, team2: null},
        {id: "mine1", team1: a, team2: b},
        {id: "other2", team1: null, team2: b},
        {id: "mine2", team1: b, team2: a},
    ];
    const {mine, others} = partitionMyMatches(matches, 1);
    assert.deepEqual(mine.map(m => m.id), ["mine1", "mine2"]);
    assert.deepEqual(others.map(m => m.id), ["other1", "other2"]);
    assert.equal(matches[0].id, "other1");
    assert.deepEqual(partitionMyMatches(matches).mine, []);
    assert.deepEqual(partitionMyMatches(matches, 1, null).mine, mine);
});

test("verified team captains and ordinary members see their team matches", () => {
    const team = {tournament_name: "Cup", name: "Team A", captains: [10], members: [11], is_verified: true};
    const match = {team1: {name: "Team A", uid: [10]}, team2: b};
    assert.deepEqual(partitionMyMatches([match], 10, [team]).mine, [match]);
    assert.deepEqual(partitionMyMatches([match], 11, [team]).mine, [match]);
    assert.deepEqual(partitionMyMatches([match], 12, [team]).mine, []);
    assert.deepEqual(partitionMyMatches([match], 11, [{...team, is_verified: false}]).mine, []);
});

test("only the player's candidate pairings are promoted and stay marked as possible", () => {
    const matches = expandMatchPossibilities([{
        datetime: null, team1: b, team2: null, is_possible: true,
        possible_pairings: [
            {team1: b.name, team2: a.name, team1_info: b, team2_info: a},
            {team1: b.name, team2: "Other", team1_info: b, team2_info: {name: "Other", uid: [3], avatar_url: "c"}},
        ],
    }]);
    const {mine, others} = partitionMyMatches(matches, 1);
    assert.equal(mine.length, 1);
    assert.deepEqual(mine[0].team2, a);
    assert.equal(mine[0].is_possible, true);
    assert.equal(others.length, 1);
});
