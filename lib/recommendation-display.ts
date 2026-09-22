import type { Recommendation } from "./recommendation.ts";

export function botRecommendationDisplay(item: Record<string, unknown>, mode: string): NonNullable<Recommendation["botDisplay"]> {
    const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
    const raw = mode === "fruits" ? item.practice_target : item.accuracy_target;
    const goal = raw && typeof raw === "object" ? raw as Record<string, unknown> : undefined;
    const pp = number(goal?.pp);
    const acc = number(goal?.accuracy);
    const isTarget = pp !== undefined && acc !== undefined && acc <= 100;
    const key = mode === "mania" && number(item.key_count) ? `${item.key_count}K · ` : "";
    let explanation = `${key}预测 ACC · 无练习目标`;
    if (isTarget) {
        const misses = number(goal?.misses);
        const combo = number(goal?.combo);
        explanation = key + (mode === "mania" || misses === undefined ? "ACC 目标" : misses === 0 ? "FC 目标" : `${misses} Miss 目标`);
        if (mode !== "mania" && combo !== undefined) explanation += ` · ${Math.trunc(combo)}x`;
        const evidence = (mode === "fruits" ? item.fc_evidence : item.accuracy_evidence) as { references?: unknown[] } | undefined;
        if (Array.isArray(evidence?.references) && evidence.references.length) explanation += ` · ${evidence.references.length}人实绩`;
    } else if (mode === "osu" || mode === "fruits") {
        const miss = number(item.expected_miss) ?? number(item.pred_miss);
        const combo = number(item.pred_combo);
        explanation = [item.performance_prediction_source === "osu-joint-model" ? "模型预测" : "预测",
            ...(miss !== undefined ? [`${miss.toFixed(1)} Miss`] : []),
            ...(combo !== undefined ? [`${Math.trunc(combo)}x`] : []),
            ...(miss === undefined && combo === undefined ? ["无练习目标"] : [])].join(" · ");
    }
    return { pp: isTarget ? pp : number(item.pred_pp), acc: isTarget ? acc : number(item.pred_acc),
        weightedGain: number(isTarget ? goal?.weighted_gain : item.predicted_weighted_snapshot_gain), isTarget, explanation };
}
