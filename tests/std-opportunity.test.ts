import assert from "node:assert/strict";
import test from "node:test";
import { stdOpportunity } from "../lib/std-opportunity.ts";

const item = { ranking_basis: "predicted-bp-gain-first", bp_gain_tier: "predicted-entry",
    predicted_weighted_snapshot_gain: 47.5, bp_entry_pp: 0, bp_entry_rank: 2, gain_snapshot_count: 1 };

test("STD gains support empty slots in a short BP without inventing FC evidence", () => {
    assert.deepEqual(stdOpportunity(item), { predictedBpGain: 47.5, bpEntryPp: 0,
        bpEntryRank: 2, bpGainTier: "predicted-entry", gainSnapshotCount: 1 });
});

test("missing and invalid gains do not become displayed predictions", () => {
    for (const row of [{}, { ...item, predicted_weighted_snapshot_gain: NaN },
        { ...item, bp_entry_pp: -1 }, { ...item, ranking_basis: "other" }]) {
        assert.deepEqual(stdOpportunity(row), {});
    }
});
