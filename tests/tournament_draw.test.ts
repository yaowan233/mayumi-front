import assert from "node:assert/strict";
import test from "node:test";
import {drawRoundGroups, drawSlotLabel, layoutDraw, visibleDraw, type DrawMatch, type TournamentDraw} from "../lib/tournament_draw.ts";

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

test("20 entrants show four opening matches and twelve entrants directly in the next round", () => {
    const entrants = Array.from({length: 20}, (_, i) => ({id: String(i + 1), name: `Player ${i + 1}`, avatar_url: ""}));
    const rounds: TournamentDraw["rounds"] = [];
    const matches: DrawMatch[] = [];
    let previous: DrawMatch[] = [];
    for (let round = 1, count = 16; count >= 1; round++, count /= 2) {
        const roundId = `W${round}`;
        rounds.push({id: roundId, name: roundId, bracket: "winner", best_of: 7});
        const current: DrawMatch[] = Array.from({length: count}, (_, i) => {
            const bye = round === 1 && i < 12;
            const teams = round === 1 ? (bye ? [String(i + 1), null] : [String(13 + (i - 12) * 2), String(14 + (i - 12) * 2)]) : [previous[i * 2].winner, previous[i * 2 + 1].winner];
            return {
                id: `${roundId}-${i + 1}`, round_id: roundId,
                sources: round === 1 ? teams.map(team => team ? {kind: "seed", seed: Number(team)} : {kind: "bye"}) : [{kind: "winner", match_id: previous[i * 2].id}, {kind: "winner", match_id: previous[i * 2 + 1].id}],
                teams, scores: [0, 0], status: bye ? "bye" : "pending", winner: bye ? teams[0] : null, loser: null, datetime: null,
            };
        });
        matches.push(...current);
        previous = current;
    }
    const original: TournamentDraw = {...state, entrants, rounds, matches};
    const snapshot = structuredClone(original);
    const visible = visibleDraw(original);
    assert.equal(visible.matches.length, 19);
    assert.equal(visible.matches.filter(match => match.round_id === "W1").length, 4);
    assert.equal(visible.matches.filter(match => match.round_id === "W2").flatMap(match => match.teams).filter(Boolean).length, 12);
    assert.equal(drawSlotLabel(visible, visible.matches.find(match => match.id === "W2-1")!, 0), "Player 1");
    assert.ok(layoutDraw(visible).height < layoutDraw(original).height);
    assert.deepEqual(original, snapshot);
});

test("double elimination links skip chained byes and omit empty round columns", () => {
    const original: TournamentDraw = {
        ...state, format: "double",
        rounds: [...state.rounds, {id: "L1", name: "败者组 1", bracket: "loser", best_of: 7}, {id: "L2", name: "败者组 2", bracket: "loser", best_of: 7}],
        matches: [...state.matches,
            {...state.matches[0], id: "L1-1", round_id: "L1", teams: [null, null], winner: null, sources: [{kind: "loser", match_id: "M2"}, {kind: "loser", match_id: "M1"}]},
            {...state.matches[0], id: "L1-2", round_id: "L1", teams: [null, null], winner: null, sources: [{kind: "winner", match_id: "L1-1"}, {kind: "bye"}]},
            {...state.matches[2], id: "L2-1", round_id: "L2", teams: [null, null], sources: [{kind: "winner", match_id: "L1-2"}, {kind: "loser", match_id: "M3"}]},
        ],
    };
    const visible = visibleDraw(original);
    const next = visible.matches.find(match => match.id === "L2-1")!;
    assert.deepEqual(next.sources[0], {kind: "loser", match_id: "M2"});
    assert.equal(drawSlotLabel(visible, next, 0), "M2 败者");
    const layout = layoutDraw(visible);
    assert.ok(!layout.headers.some(header => header.round.id === "L1"));
    for (const match of visible.matches) for (const source of match.sources) {
        if ("match_id" in source) assert.ok(layout.positions[source.match_id]);
    }
});
