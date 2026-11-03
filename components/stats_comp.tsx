"use client"

import {Avatar, Card, Chip, Spinner, Tabs} from "@heroui/react";
import React, {useMemo, useState} from "react";
import useSWR from "swr";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Stage} from "@/components/mappools";
import {useSearchParams} from "next/navigation";
import {Player, Team} from "@/app/tournaments/[tournament]/participants/page";
import {parseLeaderboardResponse, type LeaderboardRow} from "@/lib/leaderboard-response";
import {getStatisticsRoundSelection} from "@/lib/statistics-rounds";
import {buildPersonalRating, buildTeamMapScores, MIN_RATING_MAPS, ratingStatusOrder, type RatingMatchContext, type StatisticsScore as Score, type TeamMapScore} from "@/lib/statistics-scores";
import {formatLocalDateTime} from "@/lib/datetime";
import {siteConfig} from "@/config/site";
import {requestDraw} from "@/lib/tournament_draw";
import {RatingFormula} from "@/components/rating_formula";

type SortDescriptor = {
    column: React.Key;
    direction: "ascending" | "descending";
};

const getKeyValue = (item: any, key: React.Key) => item?.[key as keyof typeof item];
const STATS_TAB_CLASS = "!h-11 !w-auto shrink-0 whitespace-nowrap !px-3 text-sm font-medium text-default-500 data-[selected=true]:text-primary";
const STATS_HEADING_CLASS = "text-xl font-semibold tracking-tight text-foreground";
const STATS_CACHE_OPTIONS = {revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false};
const STATS_TABLE_HEADER_CLASS = "whitespace-nowrap border-b border-zinc-200 bg-zinc-100 px-3 py-3 text-xs font-semibold text-default-600 dark:border-zinc-700 dark:bg-zinc-800";

// --- 常量与辅助函数 ---

const STATS_COLUMNS = [
    {name: "Mod", key: "mod_name"},
    {name: "Max Score", key: "score_max"},
    {name: "Min Score", key: "score_min"},
    {name: "Avg Score", key: "score_avg"},
    {name: "Max Acc", key: "acc_max"},
    {name: "Min Acc", key: "acc_min"},
    {name: "Avg Acc", key: "acc_avg"},
    {name: "Max Miss", key: "miss_max"},
    {name: "Min Miss", key: "miss_min"},
    {name: "Avg Miss", key: "miss_avg"},
];

const getModColor = (mod: string) => {
    // 提取 Mod 前缀 (比如 RC1 -> RC)
    const key = mod.replace(/[0-9]/g, '').trim().toUpperCase();

    const map: Record<string, { color: "default" | "accent" | "success" | "warning" | "danger", hex: string }> = {
        "RC": { color: "accent", hex: "#006FEE" },   // Blue (Rice)
        "SV": { color: "accent", hex: "#9353d3" }, // Purple (Long Note)
        "HB": { color: "warning", hex: "#f5a524" },   // Orange/Gold (Hybrid)
        "LN": { color: "success", hex: "#17c964" },   // Green (Slider Velocity)
        "TB": { color: "danger", hex: "#f31260" },    // Red (Tiebreaker)
        "NM": { color: "default", hex: "#a1a1aa" },
        "HD": { color: "warning", hex: "#f5a524" },
        "HR": { color: "accent", hex: "#006FEE" },
        "DT": { color: "accent", hex: "#9353d3" },
        "FM": { color: "success", hex: "#17c964" },
    };

    // 如果找不到匹配，返回默认灰色
    return map[key] || { color: "default", hex: "#71717a" };
};

// --- 主组件 ---

export const StatsComp = ({roundInfo, stats, stage, scores, players, teams = [], ratingContext, preview = false, isTeamTournament = false}: {
    roundInfo: TournamentRoundInfo[],
    stats: Stats[],
    stage: Stage[],
    scores: Score[],
    players?: Player[],
    teams?: Team[],
    ratingContext?: RatingMatchContext,
    preview?: boolean,
    isTeamTournament?: boolean,
}) => {
    const searchParams = useSearchParams();
    const [selectedSection, setSection] = useState<{stageName: string | undefined; section: string} | null>(null);
    const requestedStage = searchParams.get('stage');
    const {visibleRounds, currentRound} = useMemo(() =>
        getStatisticsRoundSelection(roundInfo, stats, scores, requestedStage),
    [roundInfo, stats, scores, requestedStage]);
    const currentStageName = currentRound?.stage_name;
    const isTeamRound = isTeamTournament && !currentRound?.is_solo_qualifier;
    const isQualifier = Boolean(currentRound?.is_lobby || currentRound?.is_solo_qualifier);
    const section = selectedSection && selectedSection.stageName === currentStageName
        ? selectedSection.section : isQualifier ? "rankings" : "maps";
    const rankingsTitle = isQualifier ? (isTeamRound ? "资格赛队伍排名" : "资格赛排名") : "个人排名明细";
    const contextQuery = new URLSearchParams({tournament_name: currentRound?.tournament_name ?? "", stage_name: currentStageName ?? ""});
    if (preview) contextQuery.set("preview", "true");
    const {data: fetchedContext, error: contextError, isLoading: contextLoading} = useSWR<RatingMatchContext>(
        !ratingContext && (section === "rating" || (section === "rankings" && !isQualifier)) && currentStageName
            ? [`${siteConfig.backend_url}/api/statistics-rating-context?${contextQuery}`, scores, stage, players, teams] as const : null,
        ([url]) => requestDraw<RatingMatchContext>(url), STATS_CACHE_OPTIONS,
    );
    const activeContext = ratingContext ?? fetchedContext;
    const {data: qualifierLeaderboard, error: qualifierError, isLoading: qualifierLoading} = useSWR<LeaderboardRow[]>(
        isQualifier && section === "rankings" ? [`${siteConfig.backend_url}/api/cal_rank?${contextQuery}`, scores, stage, players, teams] as const : null,
        async ([url]) => parseLeaderboardResponse(await requestDraw<unknown>(url)), STATS_CACHE_OPTIONS,
    );
    const personalRating = useMemo(() => {
        if (activeContext?.leaderboard) return activeContext.leaderboard;
        const maps = stage.find(item => item.stage_name === currentStageName)?.mod_bracket.flatMap(bracket =>
            bracket.maps.map((map, index) => ({map_id: map.map_id, mod: bracket.mod, number: map.number ?? index + 1}))) ?? [];
        return buildPersonalRating(scores, players ?? [], currentStageName ?? "", maps, activeContext);
    }, [scores, players, stage, currentStageName, activeContext]);
    const rankings = isQualifier ? qualifierLeaderboard ?? [] : personalRating;
    const rankingsLoading = isQualifier ? qualifierLoading : contextLoading;
    const rankingsError = isQualifier ? qualifierError : contextError;

    return (
        <div className="flex w-full min-w-0 flex-col gap-4">

            {preview && (
                <div className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-5xl items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-700 dark:text-warning-300">
                    <span aria-hidden="true" className="mt-0.5">&#128065;</span>
                    <div>
                        <p className="font-bold">统计预览</p>
                        <p className="opacity-80">此页可显示尚未发布的资格赛结果，仅已登录的赛事管理人员可访问。</p>
                    </div>
                </div>
            )}

            {/* 1. Tabs 区域 */}
            {visibleRounds.length > 0 && <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4">
                <Tabs
                    variant="secondary"
                    className="w-full min-w-0"
                    selectedKey={currentStageName}
                    onSelectionChange={(key) => {
                        if (String(key) === currentStageName) return;
                        setSection(null);
                        const query = new URLSearchParams(searchParams.toString());
                        query.set("stage", String(key));
                        window.history.replaceState(null, "", `?${query.toString()}`);
                    }}
                >
                    <Tabs.ListContainer className="mx-auto w-fit max-w-full">
                        <Tabs.List
                            aria-label="Round Selection"
                            className="!w-max !min-w-0 gap-2"
                        >
                            {visibleRounds.map((round) => (
                                <Tabs.Tab key={round.stage_name} id={round.stage_name} className={STATS_TAB_CLASS}>
                                    {round.stage_name}
                                    <Tabs.Indicator/>
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
            </div>}

            {/* 2. 内容区域 */}
            {!currentRound && (
                <div role="status" className="flex min-h-[40vh] items-center justify-center px-4 text-default-400">
                    暂无统计数据
                </div>
            )}
            {currentRound && (
                <div
                    className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-6 px-4"
                >
                    <Tabs variant="secondary" selectedKey={section} onSelectionChange={key => setSection({stageName: currentStageName, section: String(key)})} className="w-full min-w-0">
                        <Tabs.ListContainer className="mx-auto w-fit max-w-full"><Tabs.List aria-label="统计内容" className="!w-max !min-w-0 gap-2">
                            <Tabs.Tab id="rankings" className={STATS_TAB_CLASS}>{rankingsTitle}<Tabs.Indicator/></Tabs.Tab>
                            <Tabs.Tab id="maps" className={STATS_TAB_CLASS}>单图成绩<Tabs.Indicator/></Tabs.Tab>
                            <Tabs.Tab id="rating" className={STATS_TAB_CLASS}>个人 Rating<Tabs.Indicator/></Tabs.Tab>
                            <Tabs.Tab id="stats" className={STATS_TAB_CLASS}>图池统计<Tabs.Indicator/></Tabs.Tab>
                        </Tabs.List></Tabs.ListContainer>
                    <Tabs.Panel id="rankings" className="min-w-0 !p-0 !mt-5">
                    {section === "rankings" && <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3"><h2 className={STATS_HEADING_CLASS}>{rankingsTitle}</h2>
                            {rankingsLoading && <Spinner size="sm" aria-label="正在更新排名"/>}</div>
                        {rankingsError && <p role="alert" className="text-sm text-danger">{rankingsError.message}</p>}
                        {isQualifier && rankingsLoading && rankings.length === 0 ? <Spinner aria-label="正在加载资格赛排名"/>
                            : <LeaderboardPanel key={`${currentRound.stage_name}:rankings`} leaderboard={rankings} isTeamLeaderboard={isQualifier && isTeamRound} fullDetails label={rankingsTitle}/>}
                    </div>}
                    </Tabs.Panel>
                    <Tabs.Panel id="rating" className="min-w-0 !p-0 !mt-5">
                    {section === "rating" && <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3"><h2 className={STATS_HEADING_CLASS}>个人 Rating 排名</h2>
                            {contextLoading && <Spinner size="sm" aria-label="正在更新 Rating"/>}</div>
                        <details className="rounded-lg border border-default-200 bg-default-50 text-sm">
                            <summary className="cursor-pointer px-4 py-3 font-medium text-default-700">Rating 计算公式</summary>
                            <div className="flex flex-col gap-4 border-t border-default-200 p-4 leading-relaxed text-default-600">
                                <RatingFormula/>
                                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
                                    <dt className="font-mono font-bold">Sᵢ</dt><dd>选手第 i 次出场的单图得分。同一谱面多次出场逐局计入，不只取最高分；重复导入的同一条成绩只计一次。</dd>
                                    <dt className="font-mono font-bold">Mᵢ</dt><dd>本轮该谱面的中位数基准：先计算每位选手在这张图上的平均分，再取这些平均分的中位数。每位选手只贡献一个均分，多打一场不会增加其在基准中的权重；人数为偶数时，取中间两个均分的平均值。</dd>
                                    <dt className="font-mono font-bold">n</dt><dd>选手在当前轮次实际出场的单图局数，不同于比赛场数。</dd>
                                    <dt className="font-mono font-bold">m</dt><dd>选手实际参加的赛程比赛数量。同一场比赛使用多个 MP 房间仍只算一场。</dd>
                                    <dt className="font-mono font-bold">Nⱼ</dt><dd>选手参加的第 j 场比赛里，所有实际出场的已报名选手的平均出场局数。未出场的替补不计入人数；ΣNⱼ 是这些比赛的平均出场局数之和。</dd>
                                </dl>
                                <div className="flex flex-col gap-2">
                                    <p><strong className="text-default-800">平均表现：</strong>每局得分先除以该图的中位数基准，再对所有出场取平均。P = 1 表示平均相对表现处于中位数基准，P &gt; 1 表示高于基准。</p>
                                    <p><strong className="text-default-800">出场修正：</strong>实际出场少于所参加比赛的平均出场量时，系数小于 1；达到或超过平均出场量时，系数固定为 1，不额外奖励高出场量。</p>
                                    <p><strong className="text-default-800">示例：</strong>平均表现 P = 1，实际出场 4 局，ΣNⱼ = 8，则 Rating = ∛(4/8) ≈ 0.7937。在基准、平均表现和出场比例相同的情况下，多打一场不会直接提高 Rating。</p>
                                </div>
                                <ul className="list-disc space-y-1 pl-5">
                                    <li>仅统计当前轮次图池内的有效记录，未打的谱面不作为 0 分计入平均表现。</li>
                                    <li>单图中位数基准为 0 时，该图每局的相对表现按 0 计，出场局数仍计入。</li>
                                    <li>至少打过 {MIN_RATING_MAPS} 张不同谱面且比赛关联完整后进入正式排名；不足 {MIN_RATING_MAPS} 张仍展示 Rating，不计正式名次。</li>
                                    <li>缺少或无法唯一确定比赛关联时，Rating 显示为“–”，不计正式名次。</li>
                                </ul>
                            </div>
                        </details>
                        {contextError && <p role="alert" className="text-sm text-danger">{contextError.message}</p>}
                        <LeaderboardPanel key={currentRound.stage_name} leaderboard={personalRating} />
                    </div>}
                    </Tabs.Panel>

                    <Tabs.Panel id="stats" className="min-w-0 !p-0 !mt-5">
                    {section === "stats" && <div className="flex flex-col gap-4">
                        <h2 className={STATS_HEADING_CLASS}>图池数据统计</h2>
                        <StatsTable stats={stats} stageName={currentRound.stage_name} />
                    </div>}
                    </Tabs.Panel>

                    <Tabs.Panel id="maps" className="min-w-0 !p-0 !mt-5">
                    {section === "maps" && <div className="flex flex-col gap-4">
                        <h2 className={STATS_HEADING_CLASS}>单图成绩排行</h2>
                        <MapScoresGrid
                            key={`${currentRound.stage_name}:${isTeamRound}`}
                            stage={stage}
                            round={currentRound}
                            scores={scores}
                            players={players}
                            teams={teams}
                            isTeamRound={isTeamRound}
                        />
                    </div>}
                    </Tabs.Panel>
                    </Tabs>
                </div>
            )}
        </div>
    )
}

const LeaderboardPanel = ({leaderboard, isTeamLeaderboard = false, fullDetails = false, label}: {
    leaderboard: LeaderboardRow[], isTeamLeaderboard?: boolean, fullDetails?: boolean, label?: string,
}) => {
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "Rating",
        direction: "descending",
    });

    const handleSortChange = (descriptor: SortDescriptor) => {
        const newDescriptor = { ...descriptor };
        const column = newDescriptor.column as string;

        if (column === '#') return;

        if (column !== sortDescriptor.column) {
            if (column === "平均排名") {
                newDescriptor.direction = "ascending";
            }
            else if (
                column === "Rating" ||
                column === "出场局数" ||
                column === "比赛场数" ||
                column.includes("%") ||
                column.includes("Max") ||
                column.includes("分") ||
                column.includes("成绩") ||
                column.includes("Score")
            ) {
                newDescriptor.direction = "descending";
            }
        }
        setSortDescriptor(newDescriptor);
    };

    const sortedItems = useMemo(() => {
        return [...leaderboard].sort((a, b) => {
            const statusOrder = ratingStatusOrder(a["状态"]) - ratingStatusOrder(b["状态"]);
            if (statusOrder) return statusOrder;
            const first = a[sortDescriptor.column as keyof typeof a];
            const second = b[sortDescriptor.column as keyof typeof b];

            const firstNum = Number.parseFloat(String(first ?? ""));
            const secondNum = Number.parseFloat(String(second ?? ""));

            let cmp = 0;
            if (!isNaN(firstNum) && !isNaN(secondNum)) {
                cmp = firstNum === secondNum ? 0 : firstNum < secondNum ? -1 : 1;
            } else {
                cmp = String(first ?? "").localeCompare(String(second ?? ""));
            }

            if (sortDescriptor.direction === "descending") {
                cmp *= -1;
            }

            return cmp;
        });
    }, [sortDescriptor, leaderboard]);

    const top3Data = useMemo(() => {
        if (leaderboard.length === 0) return {};
        const columns = Object.keys(leaderboard[0]);
        const result: Record<string, number[]> = {};

        columns.forEach(col => {
            if (col === 'name' || col === '#' || col === '出场局数' || col === '比赛场数') return;
            const values = leaderboard
                .map(row => Number.parseFloat(String(row[col] ?? "")))
                .filter(v => !Number.isNaN(v));
            if (values.length === 0) return;
            const uniqueValues = Array.from(new Set(values));

            const isScore =
                col.includes('分') ||
                col.includes('成绩') ||
                col.includes('Score') ||
                col.includes('Acc') ||
                col.includes('%') ||
                col === 'Rating';

            uniqueValues.sort((a, b) => isScore ? b - a : a - b);
            result[col] = uniqueValues.slice(0, 3);
        });
        return result;
    }, [leaderboard]);

    const columns = useMemo(() => {
        if (leaderboard.length === 0) return [];
        // 获取所有键，排除原始数据可能存在的 '#'（为了避免冲突或重复），然后手动把 '#' 加到最前面
        const rawKeys = Object.keys(leaderboard[0]).filter(k => !['#', '状态', '比赛场数'].includes(k) && (isTeamLeaderboard || fullDetails || ["name", "Rating", "出场局数", "平均排名", "平均分数"].includes(k)));
        return ['#', ...rawKeys];
    }, [leaderboard, fullDetails, isTeamLeaderboard]);

    const getCellStyle = (columnKey: string, value: any) => {
        if (columnKey === 'name' || columnKey === '#') return "";
        const numericVal = parseFloat(value);
        if (isNaN(numericVal) || !top3Data[columnKey]) return "";
        const rankIndex = top3Data[columnKey].indexOf(numericVal);

        if (rankIndex === 0) return "font-semibold text-yellow-600 dark:text-yellow-400";
        if (rankIndex === 1) return "font-semibold text-zinc-500 dark:text-zinc-300";
        if (rankIndex === 2) return "font-semibold text-orange-600 dark:text-orange-400";
        return "";
    };

    if (leaderboard.length === 0) return <div className="text-default-400 p-4">暂无排行数据</div>;

    return (
        <div className="flex min-w-0 max-w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-default-500">{leaderboard.length} {isTeamLeaderboard ? "支队伍" : "名选手"}</span>
        </div>
        <div role="region" aria-label={label ?? (isTeamLeaderboard ? "资格赛队伍排名" : "个人 Rating 排名")} tabIndex={0} className="max-h-[60vh] min-h-[200px] min-w-0 max-w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm tabular-nums">
                <thead className="sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-800">
                <tr>
                    {columns.map((column) => {
                        const sortable = column !== "#";
                        const isSorted = sortDescriptor.column === column;
                        return (
                            <th
                                key={column}
                                scope="col"
                                className={`${STATS_TABLE_HEADER_CLASS} ${column === '#' ? "sticky left-0 z-30 w-10 min-w-10 text-center sm:w-14 sm:min-w-14" : column === 'name' ? "sticky left-10 z-30 w-36 min-w-36 max-w-36 text-left sm:left-14 sm:w-48 sm:min-w-48 sm:max-w-48" : "text-right"} ${sortable ? "cursor-pointer hover:text-default-900" : ""}`}
                                onClick={() => {
                                    if (!sortable) return;
                                    handleSortChange({
                                        column,
                                        direction: isSorted && sortDescriptor.direction === "ascending" ? "descending" : "ascending",
                                    });
                                }}
                            >
                                <span className="inline-flex items-center gap-1">
                                    {column === "name" ? (isTeamLeaderboard ? "队伍" : "选手") : column}
                                    {isSorted && <span>{sortDescriptor.direction === "ascending" ? "↑" : "↓"}</span>}
                                </span>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {sortedItems.map((item, idx) => {
                    const row = {...item, virtual_rank: item["状态"] && item["状态"] !== "正式" ? "-" : idx + 1};
                    return (
                        <tr key={idx} className="odd:bg-zinc-50/60 dark:odd:bg-white/[0.025]">
                            {columns.map((columnKey) => {
                                const keyStr = columnKey.toString();
                                const rawVal = getKeyValue(row, columnKey);
                                const isNumericRating = keyStr === "Rating" && typeof rawVal === "number" && Number.isFinite(rawVal);
                                const displayVal = isNumericRating ? rawVal.toFixed(4) : rawVal ?? "-";
                                const style = getCellStyle(keyStr, rawVal);
                                return (
                                    <td key={keyStr} className={`whitespace-nowrap px-3 py-3 ${keyStr === '#' ? "sticky left-0 z-10 w-10 min-w-10 bg-white text-center dark:bg-zinc-900 sm:w-14 sm:min-w-14" : keyStr === 'name' ? "sticky left-10 z-10 w-36 min-w-36 max-w-36 bg-white text-left dark:bg-zinc-900 sm:left-14 sm:w-48 sm:min-w-48 sm:max-w-48" : "text-right"}`}>
                                        <span className={`${style} ${keyStr === 'name' ? 'block truncate' : ''}`} title={isNumericRating || keyStr === 'name' ? String(rawVal) : undefined}>{keyStr === "#" ? row.virtual_rank : displayVal}</span>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
        </div>
    );
};
// --- 子组件 2: 统计表格 ---
const StatsTable = ({ stats, stageName }: { stats: Stats[], stageName: string }) => {
    const currentStats = useMemo(() => stats.filter(s => s.stage_name === stageName), [stats, stageName]);

    return (
        <div className="min-w-0 max-w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
            <table className="w-full border-collapse text-sm tabular-nums" aria-label="Map Stats">
                <thead>
                <tr>
                    {STATS_COLUMNS.map((column) => (
                        <th key={column.key} scope="col" className={`${STATS_TABLE_HEADER_CLASS} ${column.key === 'mod_name' ? 'text-left' : 'text-right'}`}>
                            {column.name}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {currentStats.length === 0 ? (
                    <tr>
                        <td colSpan={STATS_COLUMNS.length} className="px-4 py-8 text-center text-default-400">暂无统计数据</td>
                    </tr>
                ) : currentStats.map((item) => (
                    <tr key={item.mod_name} className="border-t border-zinc-200/70 dark:border-white/[0.06]">
                        {STATS_COLUMNS.map((column) => {
                            const val = getKeyValue(item, column.key);
                            if (["acc_max", "acc_min", "acc_avg"].includes(column.key)) {
                                return <td key={column.key} className="whitespace-nowrap px-3 py-3 text-right">{val ? (val * 100).toFixed(2) + "%" : "-"}</td>;
                            }
                            if (["score_avg", "miss_avg"].includes(column.key)) {
                                return <td key={column.key} className="whitespace-nowrap px-3 py-3 text-right">{typeof val === "number" ? val.toFixed(2) : "-"}</td>;
                            }
                            if (column.key === "mod_name") {
                                return (
                                    <td key={column.key} className="whitespace-nowrap px-3 py-3">
                                        <Chip size="sm" color={getModColor(val).color} variant="soft">{val}</Chip>
                                    </td>
                                );
                            }
                            return <td key={column.key} className="whitespace-nowrap px-3 py-3 text-right">{val ?? "-"}</td>;
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

// --- 子组件 3: 地图成绩网格 ---
const MapScoresGrid = ({ stage, round, scores, players, teams, isTeamRound }: {
    stage: Stage[], round: TournamentRoundInfo, scores: Score[], players?: Player[], teams: Team[], isTeamRound: boolean,
}) => {
    const [view, setView] = useState(isTeamRound ? "team" : "player");
    // 获取当前轮次的图池
    const currentMapBracket = useMemo(() =>
        stage.find(s => s.stage_name === round.stage_name)?.mod_bracket || [],
    [stage, round.stage_name]);

    // 扁平化所有地图，方便渲染
    const allMaps = useMemo(() => {
        return currentMapBracket.flatMap(bracket =>
            bracket.maps.map((map, idx) => ({ ...map, mod: bracket.mod, index: idx }))
        );
    }, [currentMapBracket]);

    if (allMaps.length === 0) return <div className="text-default-400 p-4">暂无图池信息</div>;

    return (
        <>
        {isTeamRound &&
            <Tabs selectedKey={view} onSelectionChange={key => setView(String(key))}>
                <Tabs.ListContainer><Tabs.List aria-label="单图成绩类型">
                    <Tabs.Tab id="team">队伍成绩<Tabs.Indicator/></Tabs.Tab>
                    <Tabs.Tab id="player">个人成绩<Tabs.Indicator/></Tabs.Tab>
                </Tabs.List></Tabs.ListContainer>
            </Tabs>
        }
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {allMaps.map(map => (
                <SingleMapCard
                    key={`${map.map_id}:${view}`}
                    map={map}
                    roundName={round.stage_name}
                    scores={scores}
                    players={players}
                    teams={teams}
                    showTeams={isTeamRound && view === "team"}
                />
            ))}
        </div>
        </>
    );
};

// --- 子组件 4: 单个地图成绩卡片 ---
const SingleMapCard = ({ map, roundName, scores, players, teams, showTeams }: {
    map: any, roundName: string, scores: Score[], players?: Player[], teams: Team[], showTeams: boolean,
}) => {
    const modColor = getModColor(map.mod);

    // 过滤并排序成绩
    const mapScores = useMemo(() => {
        return scores
            .filter(s => s.stage_name === roundName && String(s.map_id) === String(map.map_id))
            .sort((a, b) => b.score - a.score);
    }, [scores, roundName, map.map_id]);
    const teamScores = useMemo(() => showTeams ? buildTeamMapScores(scores, teams, roundName, map.map_id) : [],
        [showTeams, scores, teams, roundName, map.map_id]);

    // 检查是否有特定 Mod 要求 (Logic from original code)
    const isContainMods = useMemo(() => {
        return mapScores.some(score => (score.mod ?? []).some(m => m !== 'NF' && m !== map.mod));
    }, [mapScores, map.mod]);
    const scoreGridClass = isContainMods
        ? "grid-cols-[24px_minmax(0,1fr)_84px] @min-[360px]:grid-cols-[32px_minmax(0,1fr)_48px_100px]"
        : "grid-cols-[24px_minmax(0,1fr)_84px] @min-[360px]:grid-cols-[32px_minmax(0,1fr)_100px]";

    return (
        <Card
            className="@container flex h-[500px] min-w-0 flex-col overflow-hidden border border-zinc-200 bg-white !p-0 shadow-lg dark:border-white/5 dark:bg-zinc-900"
        >
            {/* 1. 地图头部信息 */}
            <Card.Header className="relative h-[140px] shrink-0 overflow-hidden z-0 !p-0">
                <img
                    src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
                    alt="bg"
                    className="absolute inset-0 z-0 h-full w-full object-cover opacity-90 dark:opacity-60"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <Chip color={modColor.color} variant="primary" size="sm" className="font-bold shadow-md text-white">
                            {map.mod} {map.number ?? map.index + 1}
                        </Chip>
                        <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs text-yellow-400 font-bold border border-white/20">
                            ★ {map.star_rating}
                        </div>
                    </div>

                    <div>
                        <a href={`https://osu.ppy.sh/b/${map.map_id}`} target="_blank" rel="noopener noreferrer" className="text-white font-bold line-clamp-1 hover:text-primary transition-colors text-lg">
                            {map.map_name}
                        </a>
                        <div className="flex justify-between text-xs text-gray-300 mt-1">
                            <span>{map.diff_name}</span>
                            <span>by {map.mapper}</span>
                        </div>
                    </div>
                </div>

                {/* 侧边装饰条 */}
                <div className="absolute left-0 top-0 bottom-0 w-1 z-20" style={{backgroundColor: modColor.hex}} />
            </Card.Header>

            {/* 2. 成绩列表区域 */}
            <Card.Content className="map-score-scroll min-h-0 flex-1 overflow-y-auto !p-0 bg-zinc-50/70 dark:bg-transparent">
                {showTeams ? <TeamMapScores scores={teamScores} players={players}/> : mapScores.length > 0 ? (
                    <div className="flex flex-col">
                        {/* 表头 */}
                        <div className={`grid ${scoreGridClass} sticky top-0 z-30 gap-2 border-b border-zinc-200 bg-zinc-100 p-3 text-xs font-bold text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-800`}>
                            <div className="text-center">#</div>
                            <div>Player</div>
                            {isContainMods && <div className="hidden text-center @min-[360px]:block">Mods</div>}
                            <div className="text-right">Score / Acc</div>
                        </div>

                        {/* 列表内容 */}
                        {mapScores.map((score, idx) => {
                            const player = players?.find(p => p.uid.toString() === score.player);
                            const mods = (score.mod ?? []).filter(m => m !== 'NF' && m !== map.mod).join('');
                            return (
                                <div key={idx} className={`grid ${scoreGridClass} items-center gap-2 border-b border-zinc-200/70 p-3 text-sm transition-colors last:border-b-0 hover:bg-zinc-100 dark:border-white/[0.06] dark:hover:bg-white/5`}>
                                    <div className={`text-center font-bold ${idx < 3 ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Avatar size="sm" className="hidden shrink-0 @min-[360px]:flex">
                                                <Avatar.Image src={`https://a.ppy.sh/${player?.uid ?? ""}`} alt={player?.name || score.player}/>
                                                <Avatar.Fallback>{(player?.name || score.player)?.[0] ?? "?"}</Avatar.Fallback>
                                            </Avatar>
                                            <span title={player?.name || score.player} className="min-w-0 break-all text-small font-medium text-zinc-900 dark:text-zinc-100 @min-[360px]:truncate">
                                                {player?.name || score.player}
                                            </span>
                                        </div>
                                        {mods && <div className="mt-1 break-all text-xs text-warning @min-[360px]:hidden"><span className="sr-only">Mods: </span>{mods}</div>}
                                    </div>

                                    {isContainMods && (
                                        <div className="hidden break-all text-center text-xs text-warning @min-[360px]:block">
                                            {mods}
                                        </div>
                                    )}

                                    <div className="text-right">
                                        {/* 修复 5: 分数颜色 */}
                                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{score.score.toLocaleString()}</div>
                                        <div className={`text-xs ${score.acc === 1 ? 'text-emerald-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                            {(score.acc * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-default-400 gap-2 min-h-[200px]">
                        <p>暂无成绩数据</p>
                    </div>
                )}
            </Card.Content>
            <style jsx>{`
                :global(.map-score-scroll) {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                :global(.map-score-scroll::-webkit-scrollbar) {
                    width: 0;
                    height: 0;
                    display: none;
                }
            `}</style>
        </Card>
    )
}

const TeamMapScores = ({scores, players}: {scores: TeamMapScore[], players?: Player[]}) => {
    if (scores.length === 0) return <div className="flex min-h-[200px] items-center justify-center p-4 text-default-400">暂无队伍成绩数据</div>;
    const gridClass = "grid grid-cols-[24px_minmax(0,1fr)_100px] gap-2 @min-[360px]:grid-cols-[32px_minmax(0,1fr)_110px]";
    return <div className="flex flex-col">
        <div className={`${gridClass} sticky top-0 z-30 border-b border-zinc-200 bg-zinc-100 p-3 text-xs font-bold text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-800`}>
            <span className="text-center">#</span><span>队伍</span><span className="text-right">合计分数</span>
        </div>
        {scores.map(entry => {
            const rank = scores.findIndex(other => other.score === entry.score) + 1;
            return <details key={entry.team.name} className="group border-b border-zinc-200/70 text-sm last:border-b-0 dark:border-white/[0.06]">
                <summary aria-label={`查看 ${entry.team.name} 的成员成绩`} className={`${gridClass} cursor-pointer list-none items-center p-3 transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden`}>
                    <span className={`text-center font-bold ${rank <= 3 ? "text-primary" : "text-zinc-500 dark:text-zinc-400"}`}>{rank}</span>
                    <span className="flex min-w-0 items-center gap-2">
                        <Avatar size="sm" className="hidden shrink-0 @min-[360px]:flex">
                            <Avatar.Image src={entry.team.icon_url} alt={entry.team.name}/>
                            <Avatar.Fallback>{entry.team.name[0] ?? "?"}</Avatar.Fallback>
                        </Avatar>
                        <span className="min-w-0"><span className="block break-all font-medium text-zinc-900 dark:text-zinc-100">{entry.team.name}</span>
                            <span className="block text-xs text-default-500">{entry.members.length} 名成员 <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-180">⌄</span></span>
                        </span>
                    </span>
                    <span className="text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{entry.score.toLocaleString()}</span>
                </summary>
                <div className="border-t border-default-200 bg-default-100/50 px-3 py-2">
                    <p className="mb-2 text-xs text-default-500">{formatLocalDateTime(entry.start_time) || entry.start_time}</p>
                    {entry.members.map(score => {
                        const player = players?.find(player => String(player.uid) === String(score.player));
                        return <div key={score.player} className="flex items-center justify-between gap-3 py-1.5">
                            <span className="min-w-0 break-all text-xs">{player?.name ?? score.player}</span>
                            <span className="shrink-0 text-right"><span className="block font-mono text-xs font-bold">{score.score.toLocaleString()}</span>
                                <span className="block text-xs text-default-500">{(score.acc * 100).toFixed(2)}%</span></span>
                        </div>;
                    })}
                </div>
            </details>;
        })}
    </div>;
};

interface Stats {
    stage_name: string;
    mod_name: string;
    score_max?: number;
    score_min?: number;
    score_avg?: number;
    acc_max?: number;
    acc_min?: number;
    acc_avg?: number;
    miss_max?: number;
    miss_min?: number;
    miss_avg?: number;
}
