import type { Recommendation } from "./recommendation.ts";

export function taikoOpportunity(item: Record<string, unknown>): Partial<Pick<Recommendation, "accuracyTarget" | "accuracyEvidence">> {
    const target = item.accuracy_target as Record<string, unknown> | undefined;
    if (!target) return {};
    const { accuracy, pp, weighted_gain: weightedGain } = target;
    if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100
        || typeof pp !== "number" || !Number.isFinite(pp) || pp < 0
        || typeof weightedGain !== "number" || !Number.isFinite(weightedGain)) return {};
    const result: ReturnType<typeof taikoOpportunity> = { accuracyTarget: { accuracy, pp, weightedGain } };
    const evidence = item.accuracy_evidence as Record<string, unknown> | undefined;
    if (evidence?.basis !== "taiko-similar-players-judgements" || !Array.isArray(evidence.references)) return result;
    const references = evidence.references.filter((row): row is { player_id: number; accuracy: number; common_maps: number } =>
        row && Number.isSafeInteger(row.player_id) && row.player_id > 0
        && Number.isFinite(row.accuracy) && row.accuracy >= accuracy - 1e-9 && row.accuracy <= 100
        && Number.isSafeInteger(row.common_maps) && row.common_maps >= 1);
    const unique = [...new Map(references.map(row => [row.player_id, row])).values()];
    const required = typeof evidence.required_support === "number" && Number.isSafeInteger(evidence.required_support)
        ? Math.max(3, evidence.required_support) : 3;
    if (unique.length >= required) result.accuracyEvidence = {
        references: unique.map(row => ({ playerId: row.player_id, accuracy: row.accuracy, commonMaps: row.common_maps })),
    };
    return result;
}
