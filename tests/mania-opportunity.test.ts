import assert from "node:assert/strict";
import test from "node:test";
import { maniaOpportunity } from "../lib/mania-opportunity.ts";
import { recommendationPpDisplay } from "../lib/recommendation-pp.ts";

const item = {
    key_count: 4, ranking_basis: "accuracy-evidence-first",
    accuracy_target: { accuracy: 98.5, pp: 300, weighted_gain: 12 },
    accuracy_evidence: { basis: "similar-players-accuracy", key_count: 4, proximity: "close",
        references: [1, 2, 3].map(player_id => ({ player_id, accuracy: 99, key_count: 4, common_maps: 5 })) },
};

test("mania goal has ACC and gains, no FC or combo assumptions", () => {
    const parsed = maniaOpportunity(item);
    assert.deepEqual(parsed.accuracyTarget, { accuracy: 98.5, pp: 300, weightedGain: 12 });
    const display = recommendationPpDisplay({ pp: 180, ...parsed }, "mania");
    assert.equal(display.primary, 300);
    assert.equal(display.secondary, 180);
    assert.equal(display.weightedGain, 12);
    assert.equal(display.target, "98.50% ACC");
    assert.equal("combo" in parsed.accuracyTarget!, false);
});

test("reject cross-key, duplicate players, unsupported or invalid accuracy", () => {
    assert.deepEqual(maniaOpportunity({ ...item, key_count: 7 }), {});
    assert.deepEqual(maniaOpportunity({ ...item, accuracy_target: { ...item.accuracy_target, accuracy: 100.1 } }), {});
    for (const references of [item.accuracy_evidence.references.slice(0, 2),
        item.accuracy_evidence.references.map(row => ({ ...row, player_id: 1 })),
        item.accuracy_evidence.references.map(row => ({ ...row, accuracy: 97 })),
        item.accuracy_evidence.references.map(row => ({ ...row, key_count: 7 }))]) {
        assert.deepEqual(maniaOpportunity({ ...item, accuracy_evidence: { ...item.accuracy_evidence, references } }), {});
    }
});
