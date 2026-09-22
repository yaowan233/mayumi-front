import { featureSpecs } from "./recommendation-features.ts";
import { validProfileReference, type ProfileReference } from "./profile-reference.ts";
import type { Filters, Recommendation } from "./recommendation.ts";

const comparisonKeys: Record<string, string[]> = {
    mania: ["ln_ratio", "note_density_avg"],
    osu: ["jump_p90", "object_density_avg"],
    taiko: ["color_change_ratio", "object_density_avg"],
    fruits: ["direction_change_ratio", "x_jump_p90"],
};

const compactLabels: Record<string, string> = {
    ln_ratio: "长条占比", note_density_avg: "密度", object_density_avg: "密度",
    jump_p90: "跳距", color_change_ratio: "换色占比", direction_change_ratio: "折返占比", x_jump_p90: "横向间距",
};

const plainFeatures: Record<string, { label: string; more: string; less: string; meaning: string }> = {
    ln_ratio: { label: "长条占比", more: "长条占比更高", less: "长条占比更低", meaning: "每 100 个物件中，有多少个是长条" },
    note_density_avg: { label: "每秒音符", more: "音符更密", less: "音符更疏", meaning: "整张谱平均每秒出现多少个音符，不代表最密的一段" },
    object_density_avg: { label: "每秒物件", more: "物件更密", less: "物件更疏", meaning: "整张谱平均每秒出现多少个物件，不代表最密的一段" },
    jump_p90: { label: "较大跳距", more: "较大跳跃的距离更长", less: "较大跳跃的距离更短", meaning: "90% 的相邻物件距离不超过这个值；不是最大跳距" },
    color_change_ratio: { label: "红蓝换色占比", more: "红蓝换色占比更高", less: "红蓝换色占比更低", meaning: "相邻打击中，红蓝颜色发生切换的比例" },
    direction_change_ratio: { label: "左右折返占比", more: "左右折返占比更高", less: "左右折返占比更低", meaning: "从向左移动改为向右，或向右改为向左的比例；按原谱物件位置计算" },
    x_jump_p90: { label: "横向大间距", more: "较大的横向间距更宽", less: "较大的横向间距更窄", meaning: "相邻物件横向相隔多远：90% 的间距不超过这个值，不是最大间距" },
};

export async function loadRecommendationReference(base: string, headers: Record<string, string>, filters: Filters, signal: AbortSignal): Promise<ProfileReference | undefined> {
    if (filters.source !== "personal") return undefined;
    try {
        const response = await fetch(new URL("/recommend/profile", base), {
            method: "POST", headers, cache: "no-store",
            body: JSON.stringify({ mode: filters.mode, player_id: Number(filters.uid), key_counts: [] }),
            signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
        });
        if (!response.ok) return undefined;
        const data: unknown = await response.json();
        return validProfileReference(data, filters.mode, Number(filters.uid)) ? data : undefined;
    } catch { return undefined; }
}

export function recommendationInsights(item: Recommendation, filters: Filters, profile?: ProfileReference) {
    const target = { farm: "刷分候选", balanced: "均衡候选", peak: "进阶练习候选", style: "风格候选" }[filters.target];
    const valid = filters.source === "personal" && validProfileReference(profile, filters.mode, Number(filters.uid));
    const group = valid ? profile.groups.find(entry => entry.key_count === (filters.mode === "mania" ? item.keys : null)) : undefined;
    const comparisons = (comparisonKeys[filters.mode] ?? []).flatMap(key => {
        const reference = group?.features[key];
        const value = item.featureValues?.[key];
        const spec = featureSpecs[filters.mode].find(feature => feature.key === key)!;
        if (!reference || value === undefined || !Number.isFinite(value) || value < 0 || value > spec.max) return [];
        const delta = (value - reference.value) * spec.scale;
        const unit = spec.scale === 100 ? "百分点" : spec.unit;
        const plain = plainFeatures[key];
        const difference = Math.abs(delta) < 0.05 ? "接近 BP 均值" : `比 BP ${delta > 0 ? "高" : "低"} ${Math.abs(delta).toFixed(1)} ${unit}`;
        const hint = Math.abs(delta) < 0.05 ? `${plain.label}接近 BP` : delta > 0 ? plain.more : plain.less;
        const label = compactLabels[key];
        const percent = reference.value > 0 ? Math.round((value / reference.value - 1) * 100) : undefined;
        const compact = percent === 0 || Math.abs(delta) < 0.05 ? `${label} ≈ BP`
            : percent !== undefined ? `${label} ${percent > 0 ? "+" : ""}${percent}%`
                : spec.scale === 100 ? `${label} ${Number((value * spec.scale).toFixed(1))}%（BP 0）`
                    : `${label} ${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${spec.unit.includes("px") ? "px" : spec.unit}`;
        return [{ key, hint, text: `${plain.label}：${difference}`,
            compact,
            detail: `这张图 ${(value * spec.scale).toFixed(1)} ${spec.unit}，BP 参考 ${(reference.value * spec.scale).toFixed(1)} ${spec.unit}（来自 ${reference.samples} 条${group?.key_count ? ` ${group.key_count}K` : ""} BP）。${plain.meaning}。` }];
    });
    const reason = comparisons.length ? `${target} · ${comparisons[0].hint}` : target;
    return { reason, comparisons };
}
