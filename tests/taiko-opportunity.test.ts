import assert from "node:assert/strict";
import test from "node:test";
import { taikoOpportunity } from "../lib/taiko-opportunity.ts";

const item = {
    ranking_basis: "taiko-accuracy-gain",
    accuracy_target: { accuracy: 98.9, pp: 194, weighted_gain: 12 },
    accuracy_evidence: { basis: "taiko-similar-players-judgements", required_support: 3,
        references: [1, 2, 3].map(player_id => ({ player_id, accuracy: 99, common_maps: 5 })) },
};

test("taiko target and judgement evidence do not require mania keys or proximity", () => {
    const parsed = taikoOpportunity(item);
    assert.equal(parsed.accuracyTarget?.accuracy, 98.9);
    assert.equal(parsed.accuracyEvidence?.references.length, 3);
    assert.equal(parsed.accuracyEvidence?.keyCount, undefined);
    assert.equal(parsed.accuracyEvidence?.proximity, undefined);
});

test("missing or duplicate evidence does not erase a valid target or invent support", () => {
    for (const evidence of [undefined, { ...item.accuracy_evidence,
        references: item.accuracy_evidence.references.map(row => ({ ...row, player_id: 1 })) }]) {
        const parsed = taikoOpportunity({ ...item, accuracy_evidence: evidence });
        assert.equal(parsed.accuracyTarget?.accuracy, 98.9);
        assert.equal(parsed.accuracyEvidence, undefined);
    }
});

test("invalid target is rejected and zero gain is preserved", () => {
    assert.deepEqual(taikoOpportunity({ ...item, accuracy_target: { ...item.accuracy_target, accuracy: 101 } }), {});
    assert.equal(taikoOpportunity({ ...item, accuracy_target: { ...item.accuracy_target, weighted_gain: 0 } }).accuracyTarget?.weightedGain, 0);
});
