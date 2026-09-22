import { parseFilters, matchesFilters, type Filters, type Recommendation } from "@/lib/recommendation";
import { loadBeatmapMetadata } from "@/lib/beatmap-metadata";
import { cookies } from "next/headers";
import { siteConfig } from "@/config/site";
import { verifyRecommendationSession } from "@/lib/recommendation-session";
import { recommendationServiceError } from "@/lib/recommendation-errors";
import { loadRecommendationReference } from "@/lib/recommendation-insights";
import { ctbOpportunity } from "@/lib/ctb-opportunity";
import { maniaOpportunity } from "@/lib/mania-opportunity";
import { taikoOpportunity } from "@/lib/taiko-opportunity";
import { stdOpportunity } from "@/lib/std-opportunity";
import { botRecommendationDisplay } from "@/lib/recommendation-display";
import { requestRecommendations } from "@/lib/recommendation-request";

export const dynamic = "force-dynamic";
export const maxDuration = 660;
let active = 0;

type CustomItem = {
    beatmap_id: number; beatmapset_id?: number; title?: string; artist?: string; version?: string;
    stars: number; duration_seconds: number; bpm: number; key_count?: number; mods: string;
    match_score: number; bp_count: number; reasons: Record<string, number>;
    pred_acc?: number; pred_pp?: number; pred_miss?: number | null; ranking_score?: number; acc_prediction_source?: "model" | "rule";
    feature_values?: Record<string, number>;
    miss_prediction_source?: "rule" | "experimental-model";
    pred_combo?: number; map_max_combo?: number;
    expected_miss?: number; zero_miss_probability?: number;
    performance_prediction_source?: string; ranking_basis?: string;
    zero_miss_scenario_pp?: number; zero_miss_weighted_snapshot_gain?: number; gain_snapshot_count?: number;
    predicted_weighted_snapshot_gain?: number; bp_entry_pp?: number; bp_entry_rank?: number; bp_gain_tier?: string;
};

export async function GET(request: Request) {
    const session = await verifyRecommendationSession((await cookies()).get("uuid")?.value, siteConfig.backend_url);
    if (session.status !== "authenticated") return Response.json({
        error: session.status === "unauthorized" ? "请先登录，或重新登录后使用推荐服务。" : "登录验证服务暂时不可用，请稍后重试。",
    }, { status: session.status === "unauthorized" ? 401 : 503, headers: { "Cache-Control": "no-store" } });
    let filters: Filters;
    try { filters = parseFilters(new URL(request.url).searchParams); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "筛选条件无效" }, { status: 400 }); }
    const base = process.env.CUSTOM_RECOMMENDER_API_URL;
    if (!base) return Response.json({ error: "尚未配置定制推荐引擎地址，请联系管理员。" }, { status: 503 });
    if (active >= 2) return Response.json({ error: "推荐服务忙，请稍后重试" }, { status: 429, headers: { "Retry-After": "15" } });
    active++;
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.CUSTOM_RECOMMENDER_API_TOKEN) headers.Authorization = `Bearer ${process.env.CUSTOM_RECOMMENDER_API_TOKEN}`;
        const personal = filters.source === "personal";
        const referencePromise = loadRecommendationReference(base, headers, filters, request.signal);
        const response = await requestRecommendations(base, headers, filters, request.signal);
        if (response.status === 422) {
            const failure = await response.json().catch(() => ({}));
            if (failure.detail === "Similar-player evidence needs offline preparation for this profile"
                || failure.detail === "CTB similar-player evidence database is not configured") {
                return Response.json({ error: "这个玩家的相似玩家实绩尚未准备好，需要先离线生成证据；不会用高星图或热度推荐补位。" }, { status: 422 });
            }
            return Response.json({ error: personal ? "玩家画像或条件不可用：当前模式需要已有有效玩家画像；请检查 UID，或先使用按条件发现。不会降级为热度推荐。" : "条件或画像不可用：请检查参考谱面模式／键数，或去掉 UID 使用条件推荐（BP 画像至少需要 5 张有效谱面）。" }, { status: 422 });
        }
        if (response.status === 404) return Response.json({ error: "当前引擎尚未安装定制推荐接口，请检查服务版本。" }, { status: 503 });
        const serviceError = recommendationServiceError(response.status);
        if (serviceError) return Response.json({ error: serviceError.error }, { status: serviceError.status, headers: { "Cache-Control": "no-store" } });
        if (!response.ok) throw new Error("upstream unavailable");
        const data = await response.json();
        if (data.algorithm_version !== (personal ? "personal-filtered-v1" : "custom-conditions-v1") || !Array.isArray(data.items)
            || data.items.length > (personal ? 20 : 24) || !Number.isInteger(data.fetched_candidates)
            || !Array.isArray(data.possibly_truncated_mods)) throw new Error("invalid response");
        const metadata = await loadBeatmapMetadata(data.items.filter((item: CustomItem) => item && (!item.title || !item.artist || !item.version || !item.beatmapset_id)).map((item: CustomItem) => item.beatmap_id));
        const items: Recommendation[] = data.items.map((original: CustomItem) => {
            const extra = metadata.get(original.beatmap_id);
            const item = { ...original, title: original.title || extra?.title, artist: original.artist || extra?.artist,
                version: original.version || extra?.version, beatmapset_id: original.beatmapset_id || extra?.beatmapset_id };
            return {
            id: item.beatmap_id, setId: item.beatmapset_id, title: item.title || `谱面 #${item.beatmap_id}`,
            artist: item.artist || "", version: item.version || "谱面详情暂未获取，点击查看官网",
            stars: item.stars, seconds: item.duration_seconds, bpm: item.bpm, keys: item.key_count ?? undefined,
            mods: item.mods, matchScore: personal ? undefined : item.match_score, bpCount: item.bp_count, reasons: item.reasons,
            featureValues: item.feature_values,
            botDisplay: personal ? botRecommendationDisplay(item, filters.mode) : undefined,
            ...(personal && filters.mode === "fruits" ? ctbOpportunity(item) : {}),
            ...(personal && filters.mode === "mania" ? maniaOpportunity(item) : {}),
            ...(personal && filters.mode === "taiko" ? taikoOpportunity(item) : {}),
            ...(personal && filters.mode === "osu" ? stdOpportunity(item) : {}),
            acc: personal ? item.pred_acc : undefined, pp: personal ? item.pred_pp : undefined,
            miss: personal && (filters.mode === "fruits" || filters.mode === "osu") && typeof item.pred_miss === "number" && Number.isSafeInteger(item.pred_miss) && item.pred_miss >= 0 ? item.pred_miss : undefined,
            missSource: item.miss_prediction_source === "experimental-model" ? "experimental-model" : "rule",
            expectedMiss: personal && filters.mode === "fruits" && item.miss_prediction_source === "experimental-model" && typeof item.expected_miss === "number" && Number.isFinite(item.expected_miss) && item.expected_miss >= 0 ? item.expected_miss : undefined,
            zeroMissProbability: personal && filters.mode === "fruits" && item.miss_prediction_source === "experimental-model" && typeof item.zero_miss_probability === "number" && Number.isFinite(item.zero_miss_probability) && item.zero_miss_probability >= 0 && item.zero_miss_probability <= 1 ? item.zero_miss_probability : undefined,
            combo: personal && filters.mode === "fruits" && item.miss_prediction_source === "experimental-model" && Number.isSafeInteger(item.pred_combo) && Number.isSafeInteger(item.map_max_combo) && item.pred_combo! >= 0 && item.map_max_combo! > 0 && item.pred_combo! <= item.map_max_combo! ? item.pred_combo : undefined,
            maxCombo: personal && filters.mode === "fruits" && Number.isSafeInteger(item.map_max_combo) && item.map_max_combo! > 0 ? item.map_max_combo : undefined,
            rankingScore: personal ? item.ranking_score : undefined, accSource: personal ? item.acc_prediction_source : undefined,
            };
        });
        if (items.some(item => !matchesFilters(item, filters) || !Number.isFinite(item.bpm)
            || (personal ? (!Number.isFinite(item.acc) || item.acc! < 0 || item.acc! > 100 || !Number.isFinite(item.pp) || item.pp! < 0 || !Number.isFinite(item.rankingScore)) : (!Number.isFinite(item.matchScore) || item.matchScore! < 0 || item.matchScore! > 1))
            || !item.reasons || Object.values(item.reasons).some(value => !Number.isFinite(value) || value < 0 || value > 1))) throw new Error("condition contract violated");
        if (personal) return Response.json({ items, examined: data.fetched_candidates, profileReference: await referencePromise,
            notice: `${filters.target === "peak" ? "进阶按适度难度挑战、风格匹配和预测可玩性排序，不要求超过 BP；ACC 使用原始预测，不人为上调。不保证涨 PP。 " : ""}完整玩家推荐引擎 · 按${({ farm: "刷分", balanced: "均衡", peak: "进阶练习", style: "风格" })[filters.target]}目标排序，结合个人画像、风格簇、ACC / PP 估算及可玩性。硬条件在召回截断前生效，保留引擎排序，不再按通用热度重排。${filters.mode === "fruits" && !filters.includeConverts ? "仅原生 CTB。" : ""}预测 PP 是该次成绩的估算值，不是账号净 PP 增量；规则估算会单独标注。候选只覆盖有效难度缓存，受旧引擎能力与证据门槛约束，不保证凑满。`,
        }, { headers: { "Cache-Control": "no-store" } });
        return Response.json({ items, examined: data.fetched_candidates,
            notice: `默认综合排序：45% BP 热度 + 55% 刷分证据（BP 排位，经小样本折扣），不是全站游玩热度或个人通过率。设置偏好后，综合证据占 60%，偏好与风格占 40%。${filters.diversity ? "已启用多样性重排，综合分不保证递减。" : "按综合分降序，同分按谱面 ID 稳定排序。"}${filters.mode === "fruits" ? (filters.includeConverts ? "包含 CTB 转谱。" : "仅原生 CTB。") : ""}${data.profile_samples ? `使用 ${data.profile_samples} 条 BP 构建风格画像。` : "不使用个人 BP 画像。"}${data.possibly_truncated_mods.length ? "候选预算有限，不保证全库最优。" : ""}仅覆盖有效缓存，不限 ranked 状态。不预测个人 ACC / PP。`,
        }, { headers: { "Cache-Control": "no-store" } });
    } catch {
        return Response.json({ error: "定制推荐服务暂时不可用或超时，请确认本机算法服务已启动后重试。" }, { status: 503 });
    } finally { active--; }
}
