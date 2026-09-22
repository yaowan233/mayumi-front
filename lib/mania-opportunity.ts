import type { Recommendation } from "./recommendation";

export function maniaOpportunity(item: Record<string, unknown>): Partial<Pick<Recommendation, "accuracyTarget" | "accuracyEvidence">> {
    if (item.ranking_basis !== "accuracy-evidence-first") return {};
    const target = item.accuracy_target as Record<string, unknown> | undefined;
    const evidence = item.accuracy_evidence as Record<string, unknown> | undefined;
    if (!target || !evidence || evidence.basis !== "similar-players-accuracy" || !Array.isArray(evidence.references)) return {};
    const { accuracy, pp, weighted_gain: weightedGain } = target;
    if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100
        || typeof pp !== "number" || !Number.isFinite(pp) || pp < 0
        || typeof weightedGain !== "number" || !Number.isFinite(weightedGain) || weightedGain <= 0
        || typeof evidence.key_count !== "number" || !Number.isSafeInteger(evidence.key_count) || evidence.key_count < 1
        || evidence.key_count !== item.key_count || !["close", "broad"].includes(String(evidence.proximity))) return {};
    const references = evidence.references.filter((row): row is { player_id: number; accuracy: number; common_maps: number } =>
        row && Number.isSafeInteger(row.player_id) && row.player_id > 0 && row.key_count === evidence.key_count
        && Number.isFinite(row.accuracy) && row.accuracy >= accuracy && row.accuracy <= 100
        && Number.isSafeInteger(row.common_maps) && row.common_maps >= 5);
    if (new Set(references.map(row => row.player_id)).size < 3) return {};
    return { accuracyTarget: { accuracy, pp, weightedGain }, accuracyEvidence: {
        keyCount: evidence.key_count, proximity: evidence.proximity as "close" | "broad",
        references: references.map(row => ({ playerId: row.player_id, accuracy: row.accuracy, commonMaps: row.common_maps })),
    } };
}
