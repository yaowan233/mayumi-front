import assert from "node:assert/strict";
import test from "node:test";
import {getStatisticsRoundSelection} from "../lib/statistics-rounds.ts";

const rounds = [
    {stage_name: "资格赛", start_time: "2026-09-21"},
    {stage_name: "RO19", start_time: "2026-10-10"},
    {stage_name: "RO16", start_time: "2026-10-17"},
    {stage_name: "四分之一决赛", start_time: null},
];

test("hides unplayed EMC2 rounds even when their mappools have placeholder stats", () => {
    const result = getStatisticsRoundSelection(rounds, [
        {stage_name: "资格赛", score_max: 900000},
        {stage_name: "RO19", score_max: 800000},
        {stage_name: "RO16", score_max: 700000},
        {stage_name: "四分之一决赛", score_max: null},
    ], []);
    assert.deepEqual(result.visibleRounds, rounds.slice(0, 3));
    assert.equal(result.currentRound, rounds[2]);
});

test("retains a valid requested round and falls back for hidden or unknown rounds", () => {
    const scores = [{stage_name: "RO19"}, {stage_name: "RO16"}];
    assert.equal(getStatisticsRoundSelection(rounds, [], scores, "RO19").currentRound, rounds[1]);
    for (const requested of ["四分之一决赛", "missing", "", null]) {
        assert.equal(getStatisticsRoundSelection(rounds, [], scores, requested).currentRound, rounds[2]);
    }
});

test("accepts zero scores and undated rounds that actually have scores", () => {
    const result = getStatisticsRoundSelection(rounds, [{stage_name: "RO19", score_max: 0}], [
        {stage_name: "四分之一决赛"},
    ]);
    assert.deepEqual(result.visibleRounds, [rounds[1], rounds[3]]);
    assert.equal(result.currentRound, rounds[3]);
});

test("shows no rounds when only empty mappool statistics are available", () => {
    const result = getStatisticsRoundSelection(rounds, [
        {stage_name: "资格赛", score_max: null},
        {stage_name: "RO19"},
        {stage_name: "RO16", score_max: NaN},
    ], [], "资格赛");
    assert.deepEqual(result.visibleRounds, []);
    assert.equal(result.currentRound, undefined);
});

test("ignores scores from deleted rounds and preserves the configured round order", () => {
    const result = getStatisticsRoundSelection(rounds, [{stage_name: "deleted", score_max: 10}], [
        {stage_name: "RO16"}, {stage_name: "资格赛"}, {stage_name: "deleted"},
    ]);
    assert.deepEqual(result.visibleRounds, [rounds[0], rounds[2]]);
    assert.equal(result.currentRound, rounds[2]);
    assert.deepEqual(getStatisticsRoundSelection([], [], [{stage_name: "deleted"}]).visibleRounds, []);
});

test("preview can show a qualifier omitted from public statistics", () => {
    assert.equal(getStatisticsRoundSelection(rounds, [], []).currentRound, undefined);
    assert.equal(getStatisticsRoundSelection(rounds, [], [{stage_name: "资格赛"}]).currentRound, rounds[0]);
});
