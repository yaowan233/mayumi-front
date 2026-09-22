import assert from "node:assert/strict";
import test from "node:test";
import { ctbOpportunity } from "../lib/ctb-opportunity.ts";

test("peer support requires three distinct players on the target map", () => {
    const references = [10, 20, 30].map(player_id => ({ player_id, map_id: 99, misses: 0, common_maps: 5 }));
    const source = { beatmap_id: 99, performance_prediction_source: "experimental-joint-model", ranking_basis: "fc-evidence-first",
        practice_target: { misses: 0, combo: 100, accuracy: 99, pp: 350, weighted_gain: 5 },
        fc_evidence: { basis: "similar-players", tier: "fc-supported", references } };
    assert.equal(ctbOpportunity(source).fcEvidence?.basis, "similar-players");
    assert.equal(ctbOpportunity(source).fcEvidence?.references.length, 3);
    assert.equal(ctbOpportunity({ ...source, fc_evidence: { ...source.fc_evidence, proximity: "broad" } }).fcEvidence?.proximity, "broad");
    assert.equal(ctbOpportunity({ ...source, fc_evidence: { ...source.fc_evidence, proximity: "guaranteed" } }).fcEvidence?.proximity, undefined);
    for (const invalid of [references.slice(0, 2), references.map(row => ({ ...row, player_id: 10 })),
        references.map(row => ({ ...row, map_id: 100 })), references.map(row => ({ ...row, common_maps: 4 }))]) {
        assert.deepEqual(ctbOpportunity({ ...source, fc_evidence: { ...source.fc_evidence, references: invalid } }), {});
    }
});

const item = { performance_prediction_source: "experimental-joint-model",
    ranking_basis: "zero-miss-probability-first-snapshot-gain", zero_miss_scenario_pp: 300,
    zero_miss_weighted_snapshot_gain: 0.003, gain_snapshot_count: 200 };

test("practice targets remain distinct from predicted PP and FC-only gains", () => {
    const target = { misses: 2, combo: 750, accuracy: 99, pp: 400, weighted_gain: 12 };
    const source = { ...item, ranking_basis: "practice-scenario-gain", practice_target: target };
    assert.deepEqual(ctbOpportunity(source), { practiceTarget: { misses: 2, combo: 750, accuracy: 99, pp: 400, weightedGain: 12 } });
    assert.deepEqual(ctbOpportunity({ ...source, practice_target: { ...target, combo: -1 } }), {});
    assert.deepEqual(ctbOpportunity({ ...source, practice_target: { ...target, pp: Infinity } }), {});
});

test("scenario PP is not returned as predicted PP", () => {
    assert.deepEqual(ctbOpportunity(item), { zeroMissScenarioPp: 300, zeroMissSnapshotGain: 0.003, gainSnapshotCount: 200 });
});

test("evidence ranking requires distinct observed references", () => {
    const source = { performance_prediction_source: "experimental-joint-model", ranking_basis: "fc-evidence-first",
        practice_target: { misses: 0, combo: 100, accuracy: 99, pp: 350, weighted_gain: 5 },
        fc_evidence: { tier: "fc-supported", references: [{ map_id: 1, misses: 0 }, { map_id: 2, misses: 0 }] } };
    assert.equal(ctbOpportunity(source).fcEvidence?.references.length, 2);
    assert.deepEqual(ctbOpportunity({ ...source, fc_evidence: { ...source.fc_evidence, references: [{ map_id: 1, misses: 0 }] } }), {});
});

test("unknown sources and invalid values cannot advertise gains", () => {
    assert.deepEqual(ctbOpportunity({ ...item, performance_prediction_source: "rule" }), {});
    assert.deepEqual(ctbOpportunity({ ...item, zero_miss_weighted_snapshot_gain: NaN }), {});
    assert.deepEqual(ctbOpportunity({ ...item, gain_snapshot_count: 0 }), {});
});

test("FC-only potential is not shown as predicted BP gain", () => {
    const result = ctbOpportunity({ ...item, ranking_basis: "bp-gain-first", predicted_weighted_snapshot_gain: 0,
        bp_entry_pp: 307.66, bp_entry_rank: 100, bp_gain_tier: "fc-potential-only" });
    assert.equal(result.predictedBpGain, 0);
    assert.equal(result.bpGainTier, "fc-potential-only");
    assert.equal(result.zeroMissSnapshotGain, 0.003);
});
