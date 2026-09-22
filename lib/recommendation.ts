import { parseFeatureRanges } from "./recommendation-features.ts";
import type { ProfileReference } from "./profile-reference.ts";

export const modes = ["osu", "taiko", "fruits", "mania"] as const;
export type Mode = typeof modes[number];
export const maniaKeyCounts = [4, 5, 6, 7, 8, 9, 10] as const;
export type Filters = {
    source: "conditions" | "personal";
    mode: Mode;
    uid: string;
    query: string;
    target: "farm" | "balanced" | "peak" | "style";
    minStars: number;
    maxStars: number;
    maxLength: number;
    minBpm: number;
    maxBpm: number;
    keys: number;
    keyCounts: string;
    mod: "any" | "NM" | "DT" | "HT" | "HD" | "HR" | "HDDT" | "HDHR" | "DTHR" | "HDHRDT";
    preferredStars: string;
    preferredBpm: string;
    preferredLength: string;
    referenceId: string;
    referenceMod: "NM" | "DT" | "HT" | "HD" | "HR" | "HDDT" | "HDHR" | "DTHR" | "HDHRDT";
    diversity: number;
    includeConverts: boolean;
    excludeRecordedPlays: boolean;
    featureRanges: string;
};
export type Recommendation = {
    botDisplay?: { pp?: number; acc?: number; weightedGain?: number; isTarget: boolean; explanation: string };
    id: number;
    setId?: number;
    title: string;
    artist: string;
    version: string;
    stars: number;
    seconds: number;
    bpm?: number;
    keys?: number;
    mods: string;
    acc?: number;
    miss?: number;
    expectedMiss?: number;
    zeroMissProbability?: number;
    zeroMissScenarioPp?: number;
    practiceTarget?: { misses: number; combo: number; accuracy: number; pp: number; weightedGain: number };
    accuracyTarget?: { accuracy: number; pp: number; weightedGain: number };
    accuracyEvidence?: { keyCount?: number; proximity?: "close" | "broad"; references: { playerId: number; accuracy: number; commonMaps: number }[] };
    fcEvidence?: { basis?: "similar-players"; proximity?: "close" | "broad"; tier: "fc-supported" | "near-fc-supported"; references: { mapId: number; misses: number; playerId?: number; commonMaps?: number }[] };
    zeroMissSnapshotGain?: number;
    gainSnapshotCount?: number;
    predictedBpGain?: number;
    bpEntryPp?: number;
    bpEntryRank?: number;
    bpGainTier?: "predicted-entry" | "fc-potential-only";
    missSource?: "rule" | "experimental-model";
    combo?: number;
    maxCombo?: number;
    pp?: number;
    matchScore?: number;
    bpCount?: number;
    rankingScore?: number;
    accSource?: "model" | "rule";
    reasons?: Record<string, number>;
    featureValues?: Record<string, number>;
};
export type RecommendationResponse = { items: Recommendation[]; examined: number; notice: string; profileReference?: ProfileReference };
export const defaults: Filters = {
    source: "conditions", mode: "osu", uid: "", query: "", target: "balanced", featureRanges: "{}", keyCounts: "",
    minStars: 3, maxStars: 6, maxLength: 300, minBpm: 0, maxBpm: 1000, keys: 0, mod: "NM",
    preferredStars: "", preferredBpm: "", preferredLength: "", referenceId: "", referenceMod: "NM", diversity: 0, includeConverts: false, excludeRecordedPlays: true,
};

export function personalDefaults(uid: number, mode: Mode = "osu"): Filters {
    return { ...defaults, source: "personal", uid: String(uid), mode, minStars: 0, maxStars: 20, maxLength: 3600, mod: "any", includeConverts: ["fruits", "taiko"].includes(mode) };
}

export function modOptions(mode: Mode): Filters["referenceMod"][] {
    const common: Filters["referenceMod"][] = ["NM", "DT", "HT", "HD", "HR", "HDDT", "HDHR"];
    return mode === "taiko" ? [...common, "DTHR", "HDHRDT"] : common;
}

export function selectedKeyCounts(raw: string): number[] {
    if (!raw) return [];
    if (!/^(?:[4-9]|10)(?:,(?:[4-9]|10))*$/.test(raw)) throw new Error("键数请选择 4K–10K");
    const values = raw.split(",").map(Number);
    if (new Set(values).size !== values.length) throw new Error("键数不能重复");
    return values.sort((first, second) => first - second);
}

export function parseFilters(params: URLSearchParams): Filters {
    for (const key of params.keys()) {
        if (!Object.hasOwn(defaults, key)) throw new Error("存在不支持的筛选字段");
    }
    const values = params.get("source") === "personal" ? personalDefaults(Number(params.get("uid")), (params.get("mode") ?? "osu") as Mode) : { ...defaults };
    const includeConverts = params.get("includeConverts") ?? String(values.includeConverts);
    if (!["true", "false"].includes(includeConverts)) throw new Error("转谱选项无效");
    values.includeConverts = includeConverts === "true";
    const excludeRecordedPlays = params.get("excludeRecordedPlays") ?? "true";
    if (!["true", "false"].includes(excludeRecordedPlays)) throw new Error("已有成绩选项无效");
    values.excludeRecordedPlays = excludeRecordedPlays === "true";
    for (const key of ["minStars", "maxStars", "maxLength", "minBpm", "maxBpm", "keys", "diversity"] as const) {
        const raw = params.get(key);
        if (raw !== null) {
            if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error("请输入有效的数字范围");
            values[key] = Number(raw);
        }
    }
    const mode = params.get("mode") ?? defaults.mode;
    if (!modes.includes(mode as Mode)) throw new Error("不支持的游戏模式");
    values.mode = mode as Mode;
    values.featureRanges = JSON.stringify(parseFeatureRanges(params.get("featureRanges") ?? "{}", mode));
    const source = params.get("source") ?? defaults.source;
    if (source !== "conditions" && source !== "personal") throw new Error("不支持的推荐方式");
    values.source = source;
    const target = params.get("target") ?? defaults.target;
    if (!["farm", "balanced", "peak", "style"].includes(target)) throw new Error("不支持的推荐目标");
    values.target = target as Filters["target"];
    const mod = params.get("mod") ?? values.mod;
    if (!["any", ...modOptions(values.mode)].includes(mod)) throw new Error("不支持的 Mod");
    values.mod = mod as Filters["mod"];
    values.uid = (params.get("uid") ?? "").trim();
    values.query = (params.get("query") ?? "").trim();
    if (values.query.length > 80) throw new Error("关键词最多 80 字");
    if (source === "personal" && !/^[1-9]\d{0,9}$/.test(values.uid)) throw new Error("请输入有效的 osu! 用户 UID");
    if (values.minStars < 0 || values.maxStars > 20 || values.minStars > values.maxStars
        || values.maxLength < 10 || values.maxLength > 3600 || values.minBpm < 0
        || values.maxBpm > 1000 || values.minBpm > values.maxBpm) throw new Error("范围无效：下限不能高于上限");
    if (![0, ...maniaKeyCounts].includes(values.keys)) throw new Error("键数请选择不限或 4K–10K");
    if (values.keys !== 0 && mode !== "mania") throw new Error("键数筛选仅适用于 mania");
    const selected = selectedKeyCounts(params.get("keyCounts") ?? "");
    if (selected.length && (mode !== "mania" || values.keys !== 0)) throw new Error("多选键数仅适用于 mania，不能与旧单选条件同时使用");
    values.keyCounts = selected.join(",");
    if (values.query || (source === "conditions" && values.target !== "balanced")) throw new Error("条件发现暂不支持关键词或个人目标，请使用数值条件和风格偏好");
    for (const [key, lower, upper] of [["preferredStars", values.minStars, values.maxStars],
        ["preferredBpm", values.minBpm, values.maxBpm], ["preferredLength", 0, values.maxLength]] as const) {
        values[key] = (params.get(key) ?? "").trim();
        if (values[key] && (!Number.isFinite(Number(values[key])) || Number(values[key]) < lower || Number(values[key]) > upper)) {
            throw new Error("偏好目标必须位于允许范围内");
        }
    }
    values.referenceId = (params.get("referenceId") ?? "").trim();
    if (values.referenceId && !/^[1-9]\d{0,9}$/.test(values.referenceId)) throw new Error("参考谱面需要 Beatmap ID，而不是谱面集 ID 或链接");
    const referenceMod = params.get("referenceMod") ?? "NM";
    if (!(modOptions(values.mode) as string[]).includes(referenceMod)) throw new Error("参考 Mod 无效");
    values.referenceMod = referenceMod as Filters["referenceMod"];
    if (!values.referenceId && values.referenceMod !== "NM") throw new Error("请先填写参考谱面 ID");
    if (values.diversity < 0 || values.diversity > 0.4) throw new Error("多样性参数应在 0 到 0.4 之间");
    if (source === "personal" && (values.preferredStars || values.preferredBpm || values.preferredLength || values.referenceId || values.diversity)) throw new Error("玩家推荐使用完整引擎的目标排序，暂不叠加条件发现的额外偏好");
    return values;
}

export function toCustomRequest(filters: Filters) {
    if (filters.source === "personal") return {
        player_id: Number(filters.uid), mode: filters.mode, target: filters.target,
        candidate_limit: 500, result_limit: 20,
        min_stars: filters.minStars, max_stars: filters.maxStars, max_length: filters.maxLength,
        mods: filters.mod === "any" ? ["NM", "DT", "HT", "HD", "HR", "HDDT", "HDHR"] : [filters.mod],
        exclude_recorded_plays: filters.excludeRecordedPlays,
        include_converts: ["fruits", "taiko"].includes(filters.mode) && filters.includeConverts,
        ...(filters.minBpm !== 0 ? { min_bpm: filters.minBpm } : {}),
        ...(filters.maxBpm !== 1000 ? { max_bpm: filters.maxBpm } : {}),
        ...(filters.keys ? { key_count: filters.keys } : {}),
        ...(filters.keyCounts ? { key_counts: selectedKeyCounts(filters.keyCounts) } : {}),
        ...(filters.featureRanges !== "{}" ? { feature_ranges: parseFeatureRanges(filters.featureRanges, filters.mode) } : {}),
    };
    return {
        mode: filters.mode, mods: filters.mod === "any" ? ["NM", "DT", "HT"] : [filters.mod],
        target: undefined,
        min_stars: filters.minStars, max_stars: filters.maxStars, min_bpm: filters.minBpm, max_bpm: filters.maxBpm,
        max_length: filters.maxLength, key_count: filters.keys || null,
        key_counts: selectedKeyCounts(filters.keyCounts),
        feature_ranges: parseFeatureRanges(filters.featureRanges, filters.mode),
        player_id: null,
        reference_beatmap_id: filters.referenceId ? Number(filters.referenceId) : null,
        reference_mod: filters.referenceMod,
        include_converts: ["fruits", "taiko"].includes(filters.mode) && filters.includeConverts,
        preferred_stars: filters.preferredStars ? Number(filters.preferredStars) : null,
        preferred_bpm: filters.preferredBpm ? Number(filters.preferredBpm) : null,
        preferred_length: filters.preferredLength ? Number(filters.preferredLength) : null,
        diversity: filters.diversity, candidate_limit: 500, result_limit: 24, exclude_recorded_plays: filters.excludeRecordedPlays,
    };
}

export function matchesFilters(item: Recommendation, filters: Filters): boolean {
    for (const [name, bounds] of Object.entries(parseFeatureRanges(filters.featureRanges, filters.mode))) {
        const value = item.featureValues?.[name];
        if (value === undefined || !Number.isFinite(value) || (bounds.min !== undefined && value < bounds.min) || (bounds.max !== undefined && value > bounds.max)) return false;
    }
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || !Number.isFinite(item.stars) || !Number.isFinite(item.seconds)) return false;
    if (item.stars < filters.minStars || item.stars > filters.maxStars || item.seconds < 0 || item.seconds > filters.maxLength) return false;
    if ((filters.minBpm > 0 || filters.maxBpm < 1000)
        && (item.bpm === undefined || !Number.isFinite(item.bpm) || item.bpm < filters.minBpm || item.bpm > filters.maxBpm)) return false;
    if (filters.keys && item.keys !== filters.keys) return false;
    const selected = selectedKeyCounts(filters.keyCounts);
    if (selected.length && (item.keys === undefined || !selected.includes(item.keys))) return false;
    const allowedMods = filters.mod === "any" ? (filters.source === "personal" ? modOptions(filters.mode) : ["NM", "DT", "HT"]) : [filters.mod];
    if (!allowedMods.includes(item.mods)) return false;
    return filters.query.toLocaleLowerCase().split(/\s+/).every(word =>
        `${item.title} ${item.artist} ${item.version}`.toLocaleLowerCase().includes(word));
}
