"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Slider } from "@heroui/react";
import Image from "next/image";
import { activeFilterChips } from "@/lib/recommendation-ux";
import { recommendationInsights } from "@/lib/recommendation-insights";
import { recommendationPpDisplay } from "@/lib/recommendation-pp";
import { profileStyleFilters, referenceRanges, validProfileReference, type ProfileReference } from "@/lib/profile-reference";
import { GameModeIcon } from "@/components/gamemode_icon";
import { featureSpecs, withRatioRange, type FeatureRanges } from "@/lib/recommendation-features";
import { defaults, personalDefaults, maniaKeyCounts, modes, modOptions, parseFilters, type Mode, type Filters, type Recommendation, type RecommendationResponse } from "@/lib/recommendation";

const inputClass = "mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950";
const labels = { osu: "osu!", taiko: "太鼓", fruits: "接水果", mania: "mania" };
const keyButtonClass = "min-h-10 min-w-11 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const reasonLabels: Record<string, string> = { average_pattern_fit: "整体风格", cluster_pattern_fit: "风格簇", bp_popularity: "BP 热度", farm_evidence: "刷分证据", stars_fit: "难度匹配", bpm_fit: "节奏偏好", length_fit: "时长偏好", bp_style_fit: "BP 风格", reference_style_fit: "参考风格" };

function BeatmapCover({ setId }: { setId?: number }) {
    const [failed, setFailed] = useState(false);
    const hasCover = setId !== undefined && Number.isSafeInteger(setId) && setId > 0;

    return (
        <div className="relative h-12 overflow-hidden rounded-md bg-gradient-to-br from-primary/15 via-zinc-100 to-primary/5 dark:via-zinc-900">
            {hasCover && !failed ? <Image
                src={`https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`}
                alt=""
                fill
                unoptimized
                sizes="56px"
                className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                onError={() => setFailed(true)}
            /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-500 dark:text-zinc-400">暂无封面</div>}
        </div>
    );
}

function PracticeEvidence({ evidence }: { evidence: NonNullable<Recommendation["fcEvidence"]> }) {
    const similarPlayers = evidence.basis === "similar-players";
    const description = similarPlayers
        ? evidence.proximity === "broad" ? "共同表现差异稍大，仅供参考" : "共同谱面的表现较接近，仅供参考"
        : evidence.tier === "fc-supported" ? "相似谱面的 FC 成绩支撑" : "相似谱面的近 FC 成绩参考";
    return <details className="mt-1 text-[10px] text-zinc-500">
        <summary title={description} className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary">
            {similarPlayers ? `${evidence.references.length} 人参考` : "成绩参考"}
        </summary>
        <div className="mt-1 max-w-56 whitespace-normal leading-5">
            <p>{description}，不保证达到目标。</p>
            {evidence.references.slice(0, 3).map(reference => <a key={reference.playerId ?? reference.mapId}
                title={reference.commonMaps ? `共同谱面 ${reference.commonMaps} 张` : undefined}
                href={reference.playerId ? `https://osu.ppy.sh/users/${reference.playerId}/fruits` : `https://osu.ppy.sh/beatmaps/${reference.mapId}`}
                target="_blank" rel="noreferrer" className="mr-2 inline-block underline">
                {reference.playerId ?? reference.mapId}（{reference.misses === 0 ? "FC" : `${reference.misses} Miss`}）
            </a>)}
        </div>
    </details>;
}

function RecommendationTable({ items, filters, detailed, profileReference }: { items: Recommendation[]; filters: Filters; detailed: boolean; profileReference?: ProfileReference }) {
    const reasonColumns = [...new Set(items.flatMap(item => Object.keys(item.reasons ?? {})))];
    const accuracyGoals = ["mania", "taiko"].includes(filters.mode) && items.some(item => item.accuracyTarget || item.botDisplay?.isTarget);
    const practicePp = filters.mode === "fruits" || accuracyGoals;
    const columns = [
        { label: "星级", render: (item: Recommendation) => <span className="font-bold text-primary">★ {item.stars.toFixed(2)}</span> },
        { label: "Mod", render: (item: Recommendation) => item.mods },
        { label: "时长", render: (item: Recommendation) => `${Math.floor(item.seconds / 60)}:${String(Math.floor(item.seconds % 60)).padStart(2, "0")}` },
        { label: "BPM", render: (item: Recommendation) => item.bpm === undefined ? "—" : Math.round(item.bpm) },
        ...(filters.mode === "mania" ? [{ label: "键数", render: (item: Recommendation) => item.keys === undefined ? "—" : `${item.keys}K` }] : []),
        ...(filters.source === "personal" ? [
            { label: "BP 对比", render: (item: Recommendation) => {
                const insight = recommendationInsights(item, filters, profileReference);
                return <div className="ml-auto w-32 whitespace-normal text-right leading-5">
                    {insight.comparisons.map(comparison => <p key={comparison.key} tabIndex={0} title={comparison.detail} aria-label={`${comparison.compact}。${comparison.detail}`} className="text-[11px] text-zinc-600 dark:text-zinc-400">{comparison.compact}</p>)}
                    {!insight.comparisons.length && <p className="text-[11px] text-zinc-500">BP 数据不足，暂不能比较</p>}
                </div>;
            } },
            { label: "ACC / 目标", render: (item: Recommendation) => {
                const acc = item.botDisplay?.acc ?? item.acc;
                return <>{acc === undefined ? "—" : `${acc.toFixed(2)}%`}<span className="block text-[10px] text-zinc-500">{item.botDisplay?.isTarget ? "练习目标" : "预测 ACC"}</span></>;
            } },
            ...(filters.mode === "osu" ? [{ label: "估算 Miss", render: (item: Recommendation) => <span title="按玩家水平与谱面难度规则估算，并非 Miss 模型预测；不包含滑条断连。">{item.miss === undefined ? "—" : `${item.miss} 次`}<span className="block text-[10px] text-zinc-500">{item.miss === undefined ? "暂无估算" : "规则估算"}</span></span> }] : []),
            ...(filters.mode === "fruits" ? [{ label: "单次预测 Miss", render: (item: Recommendation) => <span title="模型基于留存的完成成绩预测平均漏接数；零 Miss 概率不是每次尝试的成功率，也不能推算重试次数。PP 使用单独的整数成绩情景。">{item.expectedMiss !== undefined ? `平均 ${item.expectedMiss.toFixed(1)} 次` : item.miss === undefined ? "—" : `${item.miss} 次`}<span className="block text-[10px] text-zinc-500">{item.zeroMissProbability !== undefined ? `零 Miss ${(item.zeroMissProbability * 100).toFixed(0)}% · 实验` : item.missSource === "experimental-model" ? "实验模型" : item.miss === undefined ? "暂无估算" : "规则估算"}</span></span> }] : []),
            ...(filters.mode === "fruits" ? [{ label: "单次预测最高连击", render: (item: Recommendation) => item.combo === undefined || item.maxCombo === undefined ? "—" : <span title="预计最高连击 / 谱面满连击；实验模型预测，不是保证。">{item.combo} / {item.maxCombo}</span> }] : []),
            { label: practicePp ? "刷图目标 PP" : "预计 PP", render: (item: Recommendation) => {
                const display = recommendationPpDisplay(item, filters.mode);
                return <span title={accuracyGoals ? "相似玩家 ACC 实绩支撑的练习目标；PP 按目标 ACC 估算判定后计算，不依赖 combo，也不是实际成绩保证。" : filters.mode === "fruits" ? "有真实成绩支撑的练习目标；达到对应 ACC、Miss 和连击后获得的 PP，不是单次预测或达成保证。" : "预计成绩对应的 PP。"}>
                    <span className="font-bold text-primary">{display.primary === undefined ? "—" : practicePp ? display.primary.toFixed(1) : Math.round(display.primary)}</span>
                    <span className="block text-[10px] text-zinc-500">{display.primary === undefined ? "暂无 PP 数据" : display.target}</span>
                </span>;
            } },
            ...(!practicePp ? [{ label: "加权 PP 增量", render: (item: Recommendation) => {
                const value = recommendationPpDisplay(item, filters.mode).weightedGain;
                return <span title="与 Bot 相同，按已知 BP 重新加权估算，不保证实际收益。" className="font-bold text-primary">{value === undefined ? "收益未知" : `+${value.toFixed(2)}`}</span>;
            } }] : []),
            ...(practicePp ? [{ label: "加权 PP 增量", render: (item: Recommendation) => {
                const value = recommendationPpDisplay(item, filters.mode).weightedGain;
                return <span title="达到刷图目标后，按已知 BP 列表重新加权计算的总 PP 增量；不是这张图的原始 PP，不含奖励 PP 和未知成绩，也不是保证收益。" className="font-bold text-primary">{value === undefined ? "—" : `+${value.toFixed(2)}`}</span>;
            } }, { label: "单次预测 PP", render: (item: Recommendation) => {
                const value = recommendationPpDisplay(item, filters.mode).secondary;
                return <span title={accuracyGoals ? "模型预测 ACC 对应的 PP，仅作辅助参考，不是练习后可达成绩。" : "模型 ACC、Miss 和最高连击对应的一次成绩情景，仅供参考，不代表多次练习后的刷分潜力。"}>{value === undefined ? "—" : value.toFixed(1)}</span>;
            } }] : []),
            ...(accuracyGoals ? [
                { label: "ACC 推荐依据", render: (item: Recommendation) => item.accuracyEvidence ? <span title={filters.mode === "taiko" ? "相近玩家的真实判定成绩参考，不要求 Mania 键数；不是成功率或达成保证。" : `${item.accuracyEvidence.proximity === "broad" ? "共同 ACC 差异稍大" : "共同 ACC 较接近"}；至少 5 张同键数、同 Mod 共同谱面的 BP 快照参考，不保证达到目标。`}>{item.accuracyEvidence.references.length} 人参考</span> : "暂无实绩依据" }] : []),
            ...(items.some(item => item.zeroMissScenarioPp !== undefined) ? [{ label: "零 Miss 潜力", render: (item: Recommendation) => item.zeroMissScenarioPp === undefined ? "—" : <span title={`保持预测 ACC，但假设零 Miss 满连的情景；不是预计成绩。加权增量只按已知 ${item.gainSnapshotCount} 条 BP 计算，不含奖励 PP 和未知成绩。`}>{item.zeroMissScenarioPp.toFixed(1)} PP<span className="block text-[10px] text-zinc-500">加权增量 +{item.zeroMissSnapshotGain?.toFixed(3)}</span></span> }] : []),
            ...(items.some(item => item.predictedBpGain !== undefined) ? [{ label: "BP 收益", render: (item: Recommendation) => item.predictedBpGain === undefined ? "—" : <span title={`BP${item.bpEntryRank} 门槛 ${item.bpEntryPp?.toFixed(2)} PP；增量按已知 BP 加权计算，不含奖励与未知成绩，不保证实际获得。`}>{item.bpGainTier === "predicted-entry" ? `预测 +${item.predictedBpGain.toFixed(3)}` : "预测未进 BP"}<span className="block text-[10px] text-zinc-500">{item.bpGainTier === "fc-potential-only" ? "仅 FC 后有潜力" : "收益优先"}</span></span> }] : []),
            ...(items.some(item => item.practiceTarget) ? [{ label: "刷图目标", render: (item: Recommendation) => item.practiceTarget ? <div title={item.fcEvidence?.basis === "similar-players" ? "这些玩家在至少 5 张共同谱面、相同 Mod 上与你表现接近，并在之后打出本图成绩。目标不是下一次成绩预测，也不保证 FC。" : item.fcEvidence ? "至少两张同 Mod 相似真实成绩支撑。ACC 取参考成绩较低值，非 FC 连击取同 Miss 参考比例中位数。只是参考情景，不保证能达到；先按证据分层，再按收益排序。" : "假设成绩情景，不是达成保证或重试次数预测。"}>{item.practiceTarget.misses === 0 ? "FC" : `${item.practiceTarget.misses} Miss`} · {item.practiceTarget.combo} 连击<span className="block text-[10px] text-zinc-500">{item.practiceTarget.accuracy.toFixed(2)}%{filters.mode !== "fruits" && ` · ${item.practiceTarget.pp.toFixed(1)} PP`}</span>{filters.mode !== "fruits" && <span className="block text-[10px] text-zinc-500">若达到，加权 +{item.practiceTarget.weightedGain.toFixed(2)}</span>}{item.fcEvidence && <PracticeEvidence evidence={item.fcEvidence} />}</div> : "—" }] : []),
            { label: "个性化评分", render: (item: Recommendation) => item.accuracyEvidence ? "相似玩家 ACC 实绩优先" : item.fcEvidence?.basis === "similar-players" ? "相似玩家实绩优先" : item.fcEvidence ? "可 FC 证据优先" : item.practiceTarget ? "刷图情景收益" : item.bpGainTier !== undefined ? "BP 收益优先" : item.zeroMissScenarioPp !== undefined ? "零 Miss 概率优先" : item.rankingScore?.toFixed(1) ?? "—" },
        ] : [{ label: "综合分 / 100", render: (item: Recommendation) => <span className="font-bold text-primary">{item.matchScore === undefined ? "—" : (item.matchScore * 100).toFixed(1)}</span> }]),
        { label: "BP 样本", render: (item: Recommendation) => item.bpCount ?? "—" },
        ...featureSpecs[filters.mode].map(feature => ({ label: `${feature.label}（原谱 ${feature.unit}）`, render: (item: Recommendation) => {
            const value = item.featureValues?.[feature.key];
            return value === undefined || !Number.isFinite(value) ? "—" : (value * feature.scale).toFixed(1);
        } })),
        ...reasonColumns.map(name => ({ label: reasonLabels[name] ?? name, render: (item: Recommendation) => item.reasons?.[name] === undefined ? "—" : (item.reasons[name] * 100).toFixed(0) })),
    ];

const visibleColumns = detailed ? columns : columns.filter(column => ["星级", "Mod", "键数", "BP 对比", "ACC / 目标", "预计 ACC", "预计 Miss", "预计最高连击", "预计 PP", "ACC 推荐依据", "刷图目标 PP", "加权 PP 增量", "刷图目标", "BP 收益", "零 Miss 潜力", "综合分 / 100"].includes(column.label));
    return <div tabIndex={0} role="region" aria-label="谱面属性对比表，可横向滚动" className="max-h-[72vh] overflow-auto rounded-xl border border-zinc-200 bg-white focus-visible:outline-2 focus-visible:outline-primary dark:border-white/10 dark:bg-zinc-900">
        <table className="w-full border-separate border-spacing-0 whitespace-nowrap text-xs tabular-nums">
            <caption className="whitespace-normal px-3 py-2 text-left text-[11px] text-zinc-500">{filters.source === "personal" ? `特点对比：这张图 vs 玩家 ${filters.uid} 的 BP 参考，均为不开 Mod 的数值${filters.mode === "mania" ? "，仅比较相同键数" : ""}。` : "保持引擎推荐顺序。"}预测不保证实际成绩。</caption>
            <thead className="sticky top-0 z-20 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><tr>
                <th scope="col" className="border-b border-zinc-200 px-3 py-3 text-center dark:border-white/10">#</th>
                <th scope="col" className="border-b border-zinc-200 bg-zinc-100 px-3 py-3 text-left sm:sticky sm:left-0 dark:border-white/10 dark:bg-zinc-800">谱面 / 难度</th>
                {visibleColumns.map(column => <th key={column.label} scope="col" className="border-b border-zinc-200 px-3 py-3 text-right font-semibold dark:border-white/10">{column.label}</th>)}
            </tr></thead>
            <tbody>{items.map((item, index) => <tr key={`${item.id}:${item.mods}`} className="group hover:bg-primary/5">
                <td className={`border-b border-zinc-100 px-3 py-2 text-center font-semibold dark:border-white/5 ${index < 3 ? "text-primary" : "text-zinc-400"}`}>{index + 1}</td>
                <th scope="row" className="border-b border-zinc-100 bg-white px-3 py-2 text-left font-normal sm:sticky sm:left-0 sm:z-10 dark:border-white/5 dark:bg-zinc-900">
                    <a href={`https://osu.ppy.sh/beatmaps/${item.id}`} target="_blank" rel="noopener noreferrer" title={`${item.artist} - ${item.title} [${item.version}]`} className="flex w-60 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-primary">
                        <span className="w-14 shrink-0"><BeatmapCover key={item.setId ?? "missing"} setId={item.setId} /></span>
                        <span className="min-w-0"><span className="block truncate text-sm font-bold group-hover:text-primary dark:group-hover:text-primary">{item.title} ↗</span><span className="block truncate text-[11px] text-zinc-500">{item.artist}</span><span className="block truncate text-[11px] text-zinc-500">{item.version}</span></span>
                    </a>
                </th>
                {visibleColumns.map(column => <td key={column.label} className="border-b border-zinc-100 px-3 py-2 text-right dark:border-white/5">{column.render(item)}</td>)}
            </tr>)}</tbody>
        </table>
    </div>;
}

export function RecommendationExplorer({ currentUserId, defaultMode = "osu" }: { currentUserId: number; defaultMode?: Mode }) {
    const [filters, setFilters] = useState<Filters>(() => personalDefaults(currentUserId, defaultMode));
    const ranges: FeatureRanges = JSON.parse(filters.featureRanges);
    const chips = activeFilterChips(filters, currentUserId);
    const [detailed, setDetailed] = useState(false);
    const [resultFilters, setResultFilters] = useState<Filters | null>(null);
    const [result, setResult] = useState<RecommendationResponse | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const controller = useRef<AbortController | null>(null);
    const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profileRequested, setProfileRequested] = useState(false);
    const [profileRetry, setProfileRetry] = useState(0);
    const [profileState, setProfileState] = useState<{ key: string; data?: ProfileReference; error?: string } | null>(null);
    const [referenceKey, setReferenceKey] = useState<number | null>(null);
    const profileUid = filters.source === "personal" ? filters.uid : String(currentUserId);
    const profileKeys = filters.mode === "mania" ? filters.keyCounts : "";
    const profileIdentity = `${filters.mode}:${profileUid}:${profileKeys}:${profileRetry}`;
    const profile = profileState?.key === profileIdentity ? profileState.data : undefined;
    const profileError = profileState?.key === profileIdentity ? profileState.error : undefined;
    const referenceGroup = profile?.groups.find(group => group.key_count === referenceKey) ?? profile?.groups[0];
    const referenceFeatures = referenceGroup?.features ?? {};
    const profileLoading = profileRequested && profileState?.key !== profileIdentity;

    useEffect(() => {
        if (!profileRequested) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ mode: filters.mode, uid: profileUid, keyCounts: profileKeys });
                const response = await fetch(`/api/recommendations/profile?${params}`, { signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "画像读取失败");
                if (!validProfileReference(data, filters.mode, Number(profileUid))) throw new Error("画像数据格式无效");
                if (!controller.signal.aborted) setProfileState({ key: profileIdentity, data });
            } catch (error) {
                if (!controller.signal.aborted) setProfileState({ key: profileIdentity, error: error instanceof Error ? error.message : "画像读取失败" });
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [profileRequested, profileIdentity, filters.mode, profileUid, profileKeys]);

    function updateFilters(patch: Partial<Filters>) {
        if (autoTimer.current) clearTimeout(autoTimer.current);
        controller.current?.abort();
        setLoading(false);
        setError("");
        setFilters(current => {
            const next = { ...current, ...patch };
            if (patch.mode) {
                next.includeConverts = next.source === "personal" && ["fruits", "taiko"].includes(next.mode);
                if (next.mod !== "any" && !modOptions(next.mode).includes(next.mod)) next.mod = "any";
                if (!modOptions(next.mode).includes(next.referenceMod)) next.referenceMod = "NM";
            }
            return next;
        });
    }

    function change<Key extends keyof Filters>(key: Key, value: Filters[Key]) {
        updateFilters({ [key]: value });
    }

    const recommend = useCallback(async (requestedFilters: Filters) => {
        controller.current?.abort();
        setLoading(false);
        const current = new AbortController();
        controller.current = current;
        setError("");
        setResult(null);
        const params = new URLSearchParams(Object.entries(requestedFilters).map(([key, value]) => [key, String(value)]));
        try { parseFilters(params); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "请检查条件"); return; }
        setLoading(true);
        try {
            const response = await fetch(`/api/recommendations?${params}`, { signal: current.signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "推荐失败");
            if (!current.signal.aborted) { setResult(data); setResultFilters(requestedFilters); }
        } catch (reason) {
            if (!current.signal.aborted) setError(reason instanceof Error ? reason.message : "网络异常，请重试");
        } finally { if (!current.signal.aborted) setLoading(false); }
    }, []);

    useEffect(() => {
        autoTimer.current = setTimeout(() => { void recommend(personalDefaults(currentUserId, defaultMode)); }, 100);
        return () => {
            if (autoTimer.current) clearTimeout(autoTimer.current);
            controller.current?.abort();
        };
    }, [currentUserId, defaultMode, recommend]);

    function submit(event: FormEvent) {
        event.preventDefault();
        if (autoTimer.current) clearTimeout(autoTimer.current);
        void recommend(filters);
    }

    function reset() {
        if (autoTimer.current) clearTimeout(autoTimer.current);
        controller.current?.abort();
        setLoading(false);
        setFilters(personalDefaults(currentUserId, filters.mode));
        setResult(null);
        setError("");
    }

    return (
        <div className="recommendation-explorer mx-auto max-w-7xl pb-12">
            <header className="mb-5">
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">谱面推荐</h1>
            </header>
            <div className="flex flex-col gap-6">
                <Card className="h-fit !p-0 border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900/60">
                    <Card.Content className="!p-5">
                        <form onSubmit={submit} onInvalidCapture={event => {
                            const section = (event.target as HTMLElement).closest("details");
                            if (section) section.open = true;
                        }} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                            <div className="col-span-full flex items-center justify-between"><h2 className="font-bold">{filters.source === "personal" && filters.uid === String(currentUserId) ? "为我推荐" : "自定义推荐"}</h2><button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-primary">重置条件</button></div>
                            <fieldset><legend className="text-sm font-semibold">游戏模式</legend><div className="mt-2 grid grid-cols-4 gap-2">
                                {modes.map(mode => <button key={mode} type="button" aria-label={labels[mode]} aria-pressed={filters.mode === mode}
                                    onClick={() => { change("mode", mode); setFilters(current => ({ ...current, keys: 0, keyCounts: "", featureRanges: "{}" })); }}
                                    className={`flex items-center justify-center gap-1 rounded-xl py-3 transition-colors ${filters.mode === mode ? "bg-primary text-white" : "bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10"}`}>
                                    <GameModeIcon mode={mode} color="currentColor" size={18} /><span className="text-[10px]">{labels[mode]}</span></button>)}
                            </div></fieldset>
                            {filters.source === "personal" && <>
                                <label className="block text-sm font-semibold">游玩目标<select className={inputClass} value={filters.target} onChange={event => change("target", event.target.value as Filters["target"])}><option value="farm">轻松刷分</option><option value="balanced">适合我的</option><option value="peak">挑战一下</option><option value="style">熟悉的风格</option></select></label>
                            </>}
                            <div className="flex items-center gap-3"><Button type="submit" isDisabled={loading} className="w-full bg-primary font-bold text-white">{loading ? "正在推荐…" : "更新推荐 →"}</Button>
                                {loading && <button type="button" onClick={() => { controller.current?.abort(); setLoading(false); }} className="shrink-0 text-xs text-zinc-500">取消</button>}
                            </div>
                            {filters.mode === "mania" && <div className="col-span-full flex items-start gap-3">
                                <span className="shrink-0 py-2.5 text-sm font-semibold">键数</span>
                                <div role="group" aria-label="键数，可多选" className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5">
                                    <button type="button" aria-pressed={!filters.keyCounts}
                                        onClick={() => change("keyCounts", "")}
                                        className={`${keyButtonClass} ${!filters.keyCounts ? "bg-primary text-white shadow-sm" : "text-zinc-500 hover:bg-white dark:text-zinc-400 dark:hover:bg-white/10"}`}>不限</button>
                                    {maniaKeyCounts.map(keys => {
                                        const selected = (filters.keyCounts || "").split(",").filter(Boolean).map(Number);
                                        const checked = selected.includes(keys);
                                        return <button key={keys} type="button" aria-pressed={checked}
                                            onClick={() => change("keyCounts", (checked ? selected.filter(value => value !== keys) : [...selected, keys]).sort((first, second) => first - second).join(","))}
                                            className={`${keyButtonClass} ${checked ? "bg-primary text-white shadow-sm" : "text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-white/10"}`}>
                                            {keys}K
                                        </button>;
                                    })}
                                </div>
                            </div>}
                            {!!chips.length && <div className="col-span-full flex flex-wrap gap-2" aria-label="已选择的筛选条件">{chips.map(chip => <button type="button" key={chip.key} aria-label={`移除条件：${chip.label}`} onClick={() => updateFilters(chip.reset)} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{chip.label} ×</button>)}</div>}
                            <details className="col-span-full rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                                <summary className="cursor-pointer text-sm font-semibold">基础筛选 · 难度、时长、Mod</summary>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <fieldset><legend className="text-sm font-semibold">星级范围</legend><div className="grid grid-cols-2 gap-3">
                                <label className="text-xs text-zinc-500">最低 ★<input className={inputClass} type="number" required min={0} max={20} step={0.1} value={filters.minStars} onChange={event => change("minStars", event.target.valueAsNumber)} /></label>
                                <label className="text-xs text-zinc-500">最高 ★<input className={inputClass} type="number" required min={0} max={20} step={0.1} value={filters.maxStars} onChange={event => change("maxStars", event.target.valueAsNumber)} /></label>
                            </div></fieldset>
                            <label className="block text-sm font-semibold">最长物件时长（秒）<input className={inputClass} type="number" required min={10} max={3600} value={Number.isFinite(filters.maxLength) ? filters.maxLength : ""} onChange={event => change("maxLength", event.target.valueAsNumber)} /></label>
                                <fieldset><legend className="text-sm font-semibold">BPM 范围</legend><div className="grid grid-cols-2 gap-3">
                                    {(["minBpm", "maxBpm"] as const).map((key, index) => <label key={key} className="text-xs text-zinc-500">{index ? "最高 BPM" : "最低 BPM"}<input className={inputClass} type="number" required min={0} max={1000} value={filters[key]} onChange={event => change(key, event.target.valueAsNumber)} /></label>)}
                                </div></fieldset>

                            <label className="block text-sm font-semibold">Mod<select className={inputClass} value={filters.mod} onChange={event => change("mod", event.target.value as Filters["mod"])}>{[...modOptions(filters.mode), "any"].map(mod => <option key={mod} value={mod}>{mod === "any" ? (filters.source === "personal" ? `引擎选择（支持的 ${modOptions(filters.mode).length} 种组合）` : "混合 NM / DT / HT") : mod}</option>)}</select></label>
                            <p className="order-20 col-span-full text-xs leading-5 text-zinc-500">星级、BPM 和时长均为 Mod 后数值。时长按首尾物件计算，不是音频长度；当前不限上架状态。</p>
                            {["fruits", "taiko"].includes(filters.mode) && <label className="order-10 flex items-center gap-2 self-center text-sm"><input type="checkbox" className="accent-primary" checked={filters.includeConverts} onChange={event => change("includeConverts", event.target.checked)} />包含转谱<span className="text-xs text-zinc-500">玩家推荐默认包含，与 Bot 一致</span></label>}
                            {filters.mode === "taiko" && filters.source === "personal" && <label className="order-10 flex items-center gap-2 self-center text-sm"><input type="checkbox" className="accent-primary" checked={filters.excludeRecordedPlays} onChange={event => change("excludeRecordedPlays", event.target.checked)} />排除已有成绩的谱面<span className="text-xs text-zinc-500">取消后包含重刷提分机会</span></label>}
                                </div>
                            </details>
                            <details className="order-20 col-span-full rounded-xl border border-zinc-200 p-3 dark:border-white/10" onToggle={event => { if (event.currentTarget.open) setProfileRequested(true); }}>
                                <summary className="cursor-pointer text-sm font-semibold">{profileUid === String(currentUserId) ? "我的风格参考" : `玩家 ${profileUid} 的风格参考`} · {labels[filters.mode]}</summary>
                                <p className="mt-3 text-xs leading-5 text-zinc-500">从已记录 BP 的原谱特征提取，与下方筛选口径一致；不是模型内部的 Mod 后向量，也不代表能力上限。默认仅供参考，不会自动限制推荐。</p>
                                {profileLoading && <p role="status" className="mt-3 text-sm text-zinc-500">正在读取 BP 风格…</p>}
                                {profileError && <p role="alert" className="mt-3 text-sm text-zinc-500">{profileError} <button type="button" className="text-primary" onClick={() => setProfileRetry(value => value + 1)}>重试画像</button></p>}
                                {profile && !profile.groups.length && <p className="mt-3 text-sm text-zinc-500">这个模式或键数暂无可用 BP 特征，可以继续正常推荐或手动筛选。</p>}
                                {referenceGroup && <>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                        {filters.mode === "mania" && <label>参考键数 <select className="rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-zinc-900" value={referenceGroup.key_count!} onChange={event => setReferenceKey(Number(event.target.value))}>{profile!.groups.map(group => <option key={group.key_count} value={group.key_count!}>{group.key_count}K</option>)}</select></label>}
                                        <span className="text-zinc-500">{referenceGroup.sample_count} 条有效 BP · 本次读取于 {new Date(profile!.generated_at).toLocaleString("zh-CN")}</span>
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{featureSpecs[filters.mode].map(feature => {
                                        const reference = referenceFeatures[feature.key];
                                        return <div key={feature.key} className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-white/5"><div className="flex justify-between gap-2"><span>{feature.label}</span><strong className="text-primary">{reference ? `${(reference.value * feature.scale).toFixed(1)} ${feature.unit}` : "样本不足"}</strong></div>
                                            <p className="mt-2 text-[11px] text-zinc-500">{reference ? `依据 ${reference.samples} 条 BP 的加权平均` : "至少需要 5 条有效特征，不用零值代替"}</p>
                                            {reference && <button type="button" className="mt-2 text-[11px] text-primary" onClick={() => {
                                                const remaining = { ...ranges };
                                                delete remaining[feature.key];
                                                updateFilters({ featureRanges: JSON.stringify({ ...remaining, ...referenceRanges(referenceGroup, filters.mode, [feature.key]) }) });
                                            }}>仅将这项参考设为范围</button>}</div>;
                                    })}</div>
                                    <button type="button" disabled={!Object.keys(referenceFeatures).length} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => updateFilters(profileStyleFilters(filters, profileUid, referenceGroup.key_count))}>按画像优先推荐 · 清除特征限制</button>
                                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">切换为「熟悉的风格」，让个人引擎排序，而不是要求所有特征同时落在平均值附近。会清除特征范围和条件发现的风格偏好，保留星级、时长和 Mod。{filters.mode === "mania" ? "同时选中当前参考键数。" : ""}点击「更新推荐」生效。需要严格限制时，再单独启用某项范围。</p>
                                </>}
                            </details>
                            <details className="order-20 col-span-full rounded-xl border border-zinc-200 p-3 dark:border-white/10" onToggle={event => { if (event.currentTarget.open) setProfileRequested(true); }}>
                                <summary className="cursor-pointer text-sm font-semibold text-primary">更多谱面偏好 · {labels[filters.mode]}</summary>
                                {profileLoading && <p role="status" className="mt-2 text-xs text-zinc-500">正在加载个人参考值，不影响手动筛选…</p>}
                                {profileError && <p className="mt-2 text-xs text-zinc-500">暂时无法显示个人参考值。<button type="button" className="text-primary" onClick={() => setProfileRetry(value => value + 1)}>重试画像</button></p>}
                                {!!Object.keys(referenceFeatures).length && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">黄色标线是当前玩家{referenceGroup?.key_count ? ` ${referenceGroup.key_count}K` : ""}的 BP 参考值，不是筛选边界。不建议同时限制所有特征；在「风格参考」中可选择按画像排序。</p>}
                                <p className="mt-3 text-xs leading-5 text-zinc-500">以下均为原谱 / NM embedding 特征，不随 Mod 改变。拖动比例条两端选择范围，0–100% 表示不限；数值条件留空不限。先严格筛选再排序，缺少所选特征的谱面不会入选。</p>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {featureSpecs[filters.mode].map(feature => <fieldset key={feature.key}>
                                        <legend className="text-xs font-semibold" title={feature.description}>{feature.label}（{feature.unit}）</legend>
                                        {referenceFeatures[feature.key] && <p className="mt-1 text-[11px] text-primary">{profileUid === String(currentUserId) ? "你的" : "该玩家"}{referenceGroup?.key_count ? ` ${referenceGroup.key_count}K` : ""} BP 参考：{(referenceFeatures[feature.key].value * feature.scale).toFixed(1)} {feature.unit}</p>}
                                        {feature.scale === 100 ? <>
                                            <div className="mt-2 flex items-center justify-between text-xs tabular-nums"><span className="font-semibold text-primary">{ranges[feature.key] ? `${Math.round((ranges[feature.key].min ?? 0) * 100)}% – ${Math.round((ranges[feature.key].max ?? 1) * 100)}%` : "不限 · 0% – 100%"}</span><button type="button" className="text-zinc-500" onClick={() => change("featureRanges", JSON.stringify(withRatioRange(ranges, feature.key, [0, 100])))}>重置</button></div>
                                            <Slider aria-label={`${feature.label}范围`} className="mt-3 px-2" minValue={0} maxValue={100} step={1}
                                                value={[(ranges[feature.key]?.min ?? 0) * 100, (ranges[feature.key]?.max ?? 1) * 100]}
                                                onChange={value => { if (Array.isArray(value)) change("featureRanges", JSON.stringify(withRatioRange(ranges, feature.key, value))); }}>
                                                <Slider.Track><Slider.Fill />{referenceFeatures[feature.key] && <span aria-hidden="true" title={`BP 参考 ${(referenceFeatures[feature.key].value * 100).toFixed(1)}%`} className="pointer-events-none absolute top-1/2 z-10 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-amber-500" style={{ left: `${referenceFeatures[feature.key].value * 100}%` }} />}<Slider.Thumb index={0} aria-label={`${feature.label}最低百分比`} /><Slider.Thumb index={1} aria-label={`${feature.label}最高百分比`} /></Slider.Track>
                                            </Slider>
                                            <div className="mt-2 flex justify-between text-[10px] text-zinc-400"><span>0%</span><span>100%</span></div>
                                        </> : <div className="grid grid-cols-2 gap-3">{(["min", "max"] as const).map(bound => <label key={bound} className="text-xs text-zinc-500">{bound === "min" ? "最低" : "最高"}<input
                                            className={inputClass} type="number" min={0} max={feature.max * feature.scale} step="any" placeholder="不限"
                                            value={ranges[feature.key]?.[bound] === undefined ? "" : Number((ranges[feature.key][bound]! * feature.scale).toFixed(6))}
                                            onChange={event => {
                                                const next = { ...ranges, [feature.key]: { ...ranges[feature.key] } };
                                                if (!event.target.value) delete next[feature.key][bound];
                                                else if (Number.isFinite(event.target.valueAsNumber)) next[feature.key][bound] = event.target.valueAsNumber / feature.scale;
                                                else return;
                                                if (!Object.keys(next[feature.key]).length) delete next[feature.key];
                                                change("featureRanges", JSON.stringify(next));
                                            }} /></label>)}</div>}
                                        <p className="mt-2 text-[11px] leading-4 text-zinc-500">{feature.description}</p>
                                    </fieldset>)}
                                </div>
                                <button type="button" className="mt-3 text-xs text-primary" onClick={() => change("featureRanges", "{}")}>清空特征条件</button>
                            </details>
                            {filters.source === "conditions" && <details className="order-20 col-span-full rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                                <summary className="cursor-pointer text-sm font-semibold text-primary">风格与目标偏好（可选）</summary>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {([['preferredStars', '偏好星级', '留空只筛选，不偏向区间中点'], ['preferredBpm', '偏好 BPM', '留空不参与排序'], ['preferredLength', '偏好物件时长（秒）', '留空不参与排序']] as const).map(([key, label, placeholder]) => <label key={key} className="block text-xs font-semibold">{label}<input type="number" step="any" className={inputClass} value={filters[key]} placeholder={placeholder} onChange={event => change(key, event.target.value)} /></label>)}
                                    <label className="block text-xs font-semibold">参考谱面 Beatmap ID<input className={inputClass} inputMode="numeric" value={filters.referenceId} placeholder="难度 ID，例如 2776140" onChange={event => { change("referenceId", event.target.value); if (!event.target.value) setFilters(current => ({ ...current, referenceMod: "NM" })); }} /></label>
                                    <label className="block text-xs font-semibold">参考谱面的 Mod<select className={inputClass} disabled={!filters.referenceId} value={filters.referenceMod} onChange={event => change("referenceMod", event.target.value as Filters["referenceMod"])}>{modOptions(filters.mode).map(mod => <option key={mod}>{mod}</option>)}</select></label>
                                    <label className="block text-xs font-semibold">多样性 · {Math.round(filters.diversity * 100)}<input className="mt-3 w-full accent-primary" type="range" min={0} max={0.4} step={0.05} value={filters.diversity} onChange={event => change("diversity", event.target.valueAsNumber)} /></label>
                                    <p className="col-span-full text-xs leading-5 text-zinc-500">数值越高，越倾向于避免风格相近的谱面连续出现。偏好目标必须在硬条件范围内。暂不支持关键词检索。</p>
                                </div>
                            </details>}
                            <details className="order-20 col-span-full text-xs text-zinc-500">
                                <summary className="cursor-pointer">其他推荐方式 / 更换玩家</summary>
                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <div className="grid grid-cols-2 gap-2" aria-label="推荐方式">
                                {(["conditions", "personal"] as const).map(source => <button key={source} type="button" aria-pressed={filters.source === source}
                                    onClick={() => { reset(); setFilters({ ...(source === "personal" ? personalDefaults(currentUserId, filters.mode) : defaults), source, mode: filters.mode, uid: String(currentUserId) }); }}
                                    className={`rounded-xl border px-3 py-3 text-sm font-bold ${filters.source === source ? "border-primary bg-primary/10 text-primary" : "border-zinc-200 dark:border-white/10"}`}>
                                    {source === "conditions" ? "按条件发现" : "按玩家推荐"}</button>)}
                            </div>

                                    {filters.source === "personal" && <>
                                <label className="block text-sm font-semibold">osu! UID<input className={inputClass} inputMode="numeric" required value={filters.uid} placeholder="例如 3162675" onChange={event => change("uid", event.target.value)} /></label>
                                    <button type="button" onClick={() => change("uid", String(currentUserId))} className="text-left text-primary">使用我的账号</button></>}
                                </div>
                            </details>
                        </form>
                    </Card.Content>
                </Card>
                <section aria-label="推荐结果" aria-busy={loading} className="min-w-0">
                    <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">推荐结果</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{result ? `${result.items.length} 张谱面` : loading ? "生成中" : "待推荐"}</span></div>
                    {result && resultFilters && JSON.stringify(filters) !== JSON.stringify(resultFilters) && <p role="status" className="mb-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">条件已修改，下方仍是上次结果。点击「更新推荐」应用。</p>}
                    {error && <div role="alert" className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/5 p-5 text-sm text-red-600 dark:text-red-400">{error}</div>}
                    {error && <button type="button" onClick={() => { void recommend(filters); }} className="mb-4 text-sm text-primary">重新推荐</button>}
                    {loading ? <div role="status" className="rounded-2xl border border-zinc-200 p-10 text-center dark:border-white/10"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><p>正在获取真实谱面数据…</p><p className="mt-2 text-sm text-zinc-500">个性化推荐首次加载可能需要一两分钟。</p></div> : result ? <>
                        {!result.items.length && <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-white/15"><h3 className="font-bold">这次没有找到匹配谱面</h3><p className="mt-2 text-sm text-zinc-500">试试放宽谱面特征、星级、BPM、时长或 Mod。我们不会自动忽略你的条件；这也不代表全谱库没有匹配项。</p>
                            {Object.keys(ranges).length > 0 && <button type="button" className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-white" onClick={() => { const next = { ...filters, featureRanges: "{}" }; updateFilters(next); void recommend(next); }}>清除特征限制并重新推荐</button>}
                        </div>}
                        {!!result.items.length && <><label className="mb-3 flex items-center gap-2 text-xs text-zinc-500"><input type="checkbox" className="accent-primary" checked={detailed} onChange={event => setDetailed(event.target.checked)} />显示更多列 · 时长、BPM、风格特征与评分</label><RecommendationTable items={result.items} filters={resultFilters ?? filters} detailed={detailed} profileReference={result.profileReference} /></>}
                    </> : !error && <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-8 text-center dark:border-white/15"><div className="mb-5 rounded-2xl bg-primary/10 p-5 text-primary"><GameModeIcon mode={filters.mode} color="currentColor" size={40} /></div><h3 className="text-xl font-bold">{loading ? "正在生成推荐…" : "暂无推荐"}</h3><p className="mt-3 max-w-sm text-sm leading-7 text-zinc-500">{loading ? "请稍候。" : "点击「更新推荐」获取谱面。"}</p></div>}
                </section>
            </div>
        </div>
    );
}
