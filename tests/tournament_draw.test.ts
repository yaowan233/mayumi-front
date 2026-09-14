import assert from "node:assert/strict";
import test from "node:test";
import {drawRoundGroups, drawSlotLabel, layoutDraw, type TournamentDraw} from "../lib/tournament_draw.ts";

const state: TournamentDraw = {
    format: "single", reset_final: false, champion: null,
    entrants: [{id: "a", name: "Alpha", avatar_url: ""}],
    rounds: [{id: "W1", name: "半决赛", bracket: "winner", best_of: 7}, {id: "W2", name: "决赛", bracket: "winner", best_of: 9}],
    matches: [
        {id: "M1", round_id: "W1", sources: [{kind: "seed", seed: 1}, {kind: "bye"}], teams: ["a", null], scores: [0, 0], status: "bye", winner: "a", loser: null, datetime: null},
        {id: "M2", round_id: "W1", sources: [{kind: "seed", seed: 2}, {kind: "seed", seed: 3}], teams: [null, null], scores: [0, 0], status: "pending", winner: null, loser: null, datetime: null},
        {id: "M3", round_id: "W2", sources: [{kind: "winner", match_id: "M1"}, {kind: "winner", match_id: "M2"}], teams: ["a", null], scores: [0, 0], status: "pending", winner: null, loser: null, datetime: null},
    ],
};

test("one BO editor represents every winner and loser column in a tournament stage", () => {
    const rounds: TournamentDraw["rounds"] = [
        {id: "W", name: "决赛", stage_name: "F", bracket: "winner", best_of: 13},
        {id: "L1", name: "败者组决赛 1", stage_name: "F", bracket: "loser", best_of: 13},
        {id: "L2", name: "败者组决赛 2", stage_name: "F", bracket: "loser", best_of: 13},
        {id: "GF", name: "总决赛", stage_name: "GF", bracket: "final", best_of: null},
    ];
    assert.deepEqual(drawRoundGroups(rounds).map(group => group.map(round => round.id)), [["W", "L1", "L2"], ["GF"]]);
    assert.equal(drawRoundGroups(state.rounds).length, 2);
});

test("public bracket distinguishes entrants, byes and unresolved match sources", () => {
    assert.equal(drawSlotLabel(state, state.matches[0], 0), "Alpha");
    assert.equal(drawSlotLabel(state, state.matches[0], 1), "轮空");
    assert.equal(drawSlotLabel(state, state.matches[2], 1), "M2 胜者");
    assert.equal(drawSlotLabel(state, {...state.matches[2], status: "unneeded", teams: [null, null]}, 0), "无需加赛");
    assert.equal(drawSlotLabel(state, {...state.matches[2], sources: [{kind: "pending", label: "待确认选手"}, {kind: "bye"}], teams: [null, null]}, 0), "待确认选手");
});

test("round columns and match cards fit the canvas without overlapping", () => {
    const layout = layoutDraw(state);
    assert.ok(layout.positions.M3.x > layout.positions.M1.x + 264);
    assert.ok(layout.positions.M2.y >= layout.positions.M1.y + 132);
    assert.equal(layout.positions.M3.y, (layout.positions.M1.y + layout.positions.M2.y) / 2);
    for (const {x, y} of Object.values(layout.positions)) {
        assert.ok(x >= 0 && y >= 0 && x + 264 <= layout.width && y + 132 <= layout.height);
    }
});
