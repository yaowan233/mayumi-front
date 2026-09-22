import type { Recommendation } from "./recommendation";

export function ctbOpportunity(item: Record<string, unknown>): Partial<Pick<Recommendation,
    "fcEvidence" | "practiceTarget" | "zeroMissScenarioPp" | "zeroMissSnapshotGain" | "gainSnapshotCount" | "predictedBpGain" | "bpEntryPp" | "bpEntryRank" | "bpGainTier">> {
    if (item.performance_prediction_source === "experimental-joint-model" && ["practice-scenario-gain", "fc-evidence-first"].includes(String(item.ranking_basis))) {
        const target = item.practice_target;
        if (!target || typeof target !== "object") return {};
        const values = target as Record<string, unknown>;
        const { misses, combo, accuracy, pp, weighted_gain: weightedGain } = values;
        if (typeof misses !== "number" || !Number.isSafeInteger(misses) || misses < 0
            || typeof combo !== "number" || !Number.isSafeInteger(combo) || combo < 0
            || typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100
            || typeof pp !== "number" || !Number.isFinite(pp) || pp < 0
            || typeof weightedGain !== "number" || !Number.isFinite(weightedGain) || weightedGain <= 0) return {};
        const practiceTarget = { misses, combo, accuracy, pp, weightedGain };
        if (item.ranking_basis === "fc-evidence-first") {
            const evidence = item.fc_evidence as { basis?: unknown; proximity?: unknown; tier?: unknown; references?: unknown } | undefined;
            if (!evidence || !["fc-supported", "near-fc-supported"].includes(String(evidence.tier)) || !Array.isArray(evidence.references)) return {};
            if (evidence.basis === "similar-players") {
                const peers = evidence.references.filter((row): row is { map_id: number; misses: number; player_id: number; common_maps: number } =>
                    row && Number.isSafeInteger(row.map_id) && row.map_id === item.beatmap_id
                    && Number.isSafeInteger(row.player_id) && row.player_id > 0
                    && Number.isSafeInteger(row.common_maps) && row.common_maps >= 5
                    && Number.isSafeInteger(row.misses) && row.misses >= 0 && row.misses <= 2);
                if (new Set(peers.map(row => row.player_id)).size < 3) return {};
                return { practiceTarget, fcEvidence: { basis: "similar-players", tier: evidence.tier as "fc-supported" | "near-fc-supported",
                    proximity: evidence.proximity === "close" || evidence.proximity === "broad" ? evidence.proximity : undefined,
                    references: peers.map(row => ({ mapId: row.map_id, misses: row.misses, playerId: row.player_id, commonMaps: row.common_maps })) } };
            }
            const references = evidence.references.filter((row): row is { map_id: number; misses: number } => row && Number.isSafeInteger(row.map_id) && row.map_id > 0 && Number.isSafeInteger(row.misses) && row.misses >= 0 && row.misses <= 2);
            if (new Set(references.map(row => row.map_id)).size < 2) return {};
            return { practiceTarget, fcEvidence: { tier: evidence.tier as "fc-supported" | "near-fc-supported", references: references.map(row => ({ mapId: row.map_id, misses: row.misses })) } };
        }
        return { practiceTarget };
    }
    if (item.performance_prediction_source !== "experimental-joint-model"
        || !["zero-miss-probability-first-snapshot-gain", "bp-gain-first"].includes(String(item.ranking_basis))) return {};
    const pp = item.zero_miss_scenario_pp;
    const gain = item.zero_miss_weighted_snapshot_gain;
    const count = item.gain_snapshot_count;
    if (typeof pp !== "number" || !Number.isFinite(pp) || pp < 0
        || typeof gain !== "number" || !Number.isFinite(gain) || gain < 0
        || typeof count !== "number" || !Number.isSafeInteger(count) || count <= 0) return {};
    const scenario = { zeroMissScenarioPp: pp, zeroMissSnapshotGain: gain, gainSnapshotCount: count };
    if (item.ranking_basis !== "bp-gain-first") return scenario;
    const predicted = item.predicted_weighted_snapshot_gain;
    const floor = item.bp_entry_pp;
    const rank = item.bp_entry_rank;
    if (typeof predicted !== "number" || !Number.isFinite(predicted) || predicted < 0
        || typeof floor !== "number" || !Number.isFinite(floor) || floor < 0
        || typeof rank !== "number" || !Number.isSafeInteger(rank) || rank < 1 || rank > 100
        || !["predicted-entry", "fc-potential-only"].includes(String(item.bp_gain_tier))) return {};
    return { ...scenario, predictedBpGain: predicted, bpEntryPp: floor, bpEntryRank: rank,
        bpGainTier: item.bp_gain_tier as "predicted-entry" | "fc-potential-only" };
}
