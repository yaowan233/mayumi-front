import { defaults, personalDefaults, type Filters } from "./recommendation.ts";
import { featureSpecs, type FeatureRanges } from "./recommendation-features.ts";

export function activeFilterChips(filters: Filters, currentUserId: number) {
    const base = filters.source === "personal" ? personalDefaults(currentUserId, filters.mode) : defaults;
    const chips: { key: string; label: string; reset: Partial<Filters> }[] = [];
    if (filters.source === "personal" && filters.uid !== String(currentUserId)) chips.push({ key: "uid", label: `玩家 ${filters.uid}`, reset: { uid: String(currentUserId) } });
    if (filters.minStars !== base.minStars || filters.maxStars !== base.maxStars) chips.push({ key: "stars", label: `★ ${filters.minStars}–${filters.maxStars}`, reset: { minStars: base.minStars, maxStars: base.maxStars, preferredStars: "" } });
    if (filters.maxLength !== base.maxLength) chips.push({ key: "length", label: `最长 ${filters.maxLength} 秒`, reset: { maxLength: base.maxLength, preferredLength: "" } });
    if (filters.minBpm !== base.minBpm || filters.maxBpm !== base.maxBpm) chips.push({ key: "bpm", label: `BPM ${filters.minBpm}–${filters.maxBpm}`, reset: { minBpm: base.minBpm, maxBpm: base.maxBpm, preferredBpm: "" } });
    if (filters.mod !== base.mod) chips.push({ key: "mod", label: `Mod ${filters.mod}`, reset: { mod: base.mod } });
    if (filters.keyCounts || filters.keys) chips.push({ key: "keys", label: `${(filters.keyCounts || String(filters.keys)).split(",").join("K / ")}K`, reset: { keyCounts: "", keys: 0 } });
    if (filters.includeConverts !== base.includeConverts) chips.push({ key: "converts", label: filters.includeConverts ? "包含转谱" : "排除转谱", reset: { includeConverts: base.includeConverts } });
    if (!filters.excludeRecordedPlays) chips.push({ key: "replays", label: "允许 BP 内谱面", reset: { excludeRecordedPlays: true } });
    const ranges: FeatureRanges = JSON.parse(filters.featureRanges);
    for (const feature of featureSpecs[filters.mode]) {
        const range = ranges[feature.key];
        if (!range) continue;
        const remaining = { ...ranges };
        delete remaining[feature.key];
        const format = (value: number) => Number((value * feature.scale).toFixed(2));
        chips.push({ key: feature.key, label: `${feature.label} ${range.min === undefined ? "不限" : format(range.min)}–${range.max === undefined ? "不限" : format(range.max)} ${feature.unit}`, reset: { featureRanges: JSON.stringify(remaining) } });
    }
    for (const [key, label] of [["preferredStars", "偏好星级"], ["preferredBpm", "偏好 BPM"], ["preferredLength", "偏好时长"]] as const) {
        if (filters[key]) chips.push({ key, label: `${label} ${filters[key]}`, reset: { [key]: "" } });
    }
    if (filters.referenceId) chips.push({ key: "reference", label: `参考谱面 ${filters.referenceId} ${filters.referenceMod}`, reset: { referenceId: "", referenceMod: "NM" } });
    if (filters.diversity) chips.push({ key: "diversity", label: `多样性 ${Math.round(filters.diversity * 100)}`, reset: { diversity: 0 } });
    return chips;
}
