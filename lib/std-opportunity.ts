import type { Recommendation } from "./recommendation";

export function stdOpportunity(item: Record<string, unknown>): Partial<Pick<Recommendation,
    "predictedBpGain" | "bpEntryPp" | "bpEntryRank" | "bpGainTier" | "gainSnapshotCount">> {
    const { predicted_weighted_snapshot_gain: gain, bp_entry_pp: floor,
        bp_entry_rank: rank, gain_snapshot_count: count } = item;
    if (item.ranking_basis !== "predicted-bp-gain-first" || item.bp_gain_tier !== "predicted-entry"
        || typeof gain !== "number" || !Number.isFinite(gain) || gain <= 0
        || typeof floor !== "number" || !Number.isFinite(floor) || floor < 0
        || typeof rank !== "number" || !Number.isSafeInteger(rank) || rank < 1 || rank > 100
        || typeof count !== "number" || !Number.isSafeInteger(count) || count < 1) return {};
    return { predictedBpGain: gain, bpEntryPp: floor, bpEntryRank: rank,
        bpGainTier: "predicted-entry", gainSnapshotCount: count };
}
