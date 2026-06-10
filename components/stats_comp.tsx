"use client"

import {Avatar, Card, Chip, Spinner, Tabs} from "@heroui/react";
import React, {useEffect, useMemo, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Stage} from "@/components/mappools";
import {useRouter, useSearchParams} from "next/navigation";
import {Player} from "@/app/tournaments/[tournament]/participants/page";
import {siteConfig} from "@/config/site";

type SortDescriptor = {
    column: React.Key;
    direction: "ascending" | "descending";
};

const getKeyValue = (item: any, key: React.Key) => item?.[key as keyof typeof item];

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

export const StatsComp = ({roundInfo, stats, stage, scores, players}: {
    roundInfo: TournamentRoundInfo[],
    stats: Stats[],
    stage: Stage[],
    scores: Score[],
    players?: Player[]
}) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentStageName = searchParams.get('stage') || roundInfo.at(-1)?.stage_name;

    // 使用 useMemo 缓存当前选中的 round 数据，避免每次渲染都 find
    const currentRound = useMemo(() =>
        roundInfo.find(r => r.stage_name === currentStageName) || roundInfo.at(-1),
    [roundInfo, currentStageName]);

    return (
        <div className="w-full flex flex-col gap-6">

            {/* 1. Tabs 区域 */}
            <div className="w-full">
                <Tabs
                    className="w-full"
                    selectedKey={currentStageName}
                    onSelectionChange={(key) => router.replace(`?stage=${encodeURIComponent(String(key))}`)}
                >
                    <Tabs.ListContainer className="w-full">
                        <Tabs.List
                            aria-label="Round Selection"
                            className="w-full relative !rounded-none !bg-transparent p-0 border-b border-divider overflow-x-auto scrollbar-hide flex justify-start md:justify-center"
                        >
                            {roundInfo.map((round) => (
                                <Tabs.Tab key={round.stage_name} id={round.stage_name} className="max-w-fit h-12 !rounded-none !bg-transparent px-6 text-lg font-bold text-default-500 transition-colors hover:text-foreground data-[selected=true]:text-primary">
                                    {round.stage_name}
                                    <Tabs.Indicator className="!top-auto !bottom-0 !h-0.5 !rounded-none !bg-primary" />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
            </div>

            {/* 2. 内容区域 */}
            {currentRound && (
                <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto px-4">
                    {(currentRound.is_lobby || currentRound.is_solo_qualifier) && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-2xl font-bold px-2 border-l-4 border-primary">总排行榜</h2>
                            <LeaderboardPanel round={currentRound} />
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold px-2 border-l-4 border-secondary">图池数据统计</h2>
                        <StatsTable stats={stats} stageName={currentRound.stage_name} />
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold px-2 border-l-4 border-warning">单图成绩排行</h2>
                        <MapScoresGrid
                            stage={stage}
                            round={currentRound}
                            scores={scores}
                            players={players}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const LeaderboardPanel = ({round}: { round: TournamentRoundInfo }) => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "平均排名",
        direction: "ascending",
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${siteConfig.backend_url}/api/cal_rank?tournament_name=${round.tournament_name}&stage_name=${round.stage_name}`,
                    {next: {revalidate: 60}});
                if (res.ok) {
                    setLeaderboard(await res.json());
                }
            } catch (e) {
                console.error("Failed to load leaderboard", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [round]);

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
            const first = a[sortDescriptor.column as keyof typeof a];
            const second = b[sortDescriptor.column as keyof typeof b];

            const firstNum = parseFloat(first);
            const secondNum = parseFloat(second);

            let cmp = 0;
            if (!isNaN(firstNum) && !isNaN(secondNum)) {
                cmp = firstNum < secondNum ? -1 : 1;
            } else {
                cmp = (first || "").toString().localeCompare(second || "");
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
            if (col === 'name' || col === '#') return;
            const values = leaderboard.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
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
        const rawKeys = Object.keys(leaderboard[0]).filter(k => k !== '#');
        return ['#', ...rawKeys];
    }, [leaderboard]);

    const getCellStyle = (columnKey: string, value: any) => {
        if (columnKey === 'NAME' || columnKey === '#') return "";
        const numericVal = parseFloat(value);
        if (isNaN(numericVal) || !top3Data[columnKey]) return "";
        const rankIndex = top3Data[columnKey].indexOf(numericVal);

        if (rankIndex === 0) return "text-yellow-600 dark:text-yellow-400 font-black dark:drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]";
        if (rankIndex === 1) return "text-zinc-500 dark:text-white font-extrabold dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]";
        if (rankIndex === 2) return "text-orange-600 dark:text-orange-400 font-bold";
        return "";
    };

    if (loading) return (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-3 text-default-500">
            <Spinner />
            <span>加载排行榜...</span>
        </div>
    );
    if (leaderboard.length === 0) return <div className="text-default-400 p-4">暂无排行数据</div>;

    return (
        <div className="min-h-[200px] overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
            <table className="w-full border-collapse text-sm">
                <thead>
                <tr>
                    {columns.map((column) => {
                        const sortable = column !== "#";
                        const isSorted = sortDescriptor.column === column;
                        return (
                            <th
                                key={column}
                                scope="col"
                                className={`whitespace-nowrap bg-default-100 px-4 py-3 text-left text-xs font-bold uppercase text-default-600 ${sortable ? "cursor-pointer hover:text-default-900" : ""}`}
                                onClick={() => {
                                    if (!sortable) return;
                                    handleSortChange({
                                        column,
                                        direction: isSorted && sortDescriptor.direction === "ascending" ? "descending" : "ascending",
                                    });
                                }}
                            >
                                <span className="inline-flex items-center gap-1">
                                    {column}
                                    {isSorted && <span>{sortDescriptor.direction === "ascending" ? "↑" : "↓"}</span>}
                                </span>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {sortedItems.map((item, idx) => {
                    const row = {...item, virtual_rank: idx + 1};
                    return (
                        <tr key={idx} className="odd:bg-zinc-50/60 dark:odd:bg-white/[0.025]">
                            {columns.map((columnKey) => {
                                const keyStr = columnKey.toString();
                                const rawVal = getKeyValue(row, columnKey);
                                const displayVal = rawVal ?? "-";
                                const style = getCellStyle(keyStr, rawVal);
                                return (
                                    <td key={keyStr} className="whitespace-nowrap px-4 py-3">
                                        <span className={style}>{keyStr === "#" ? row.virtual_rank : displayVal}</span>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};
// --- 子组件 2: 统计表格 ---
const StatsTable = ({ stats, stageName }: { stats: Stats[], stageName: string }) => {
    const currentStats = useMemo(() => stats.filter(s => s.stage_name === stageName), [stats, stageName]);

    return (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
            <table className="w-full border-collapse text-sm" aria-label="Map Stats">
                <thead>
                <tr>
                    {STATS_COLUMNS.map((column) => (
                        <th key={column.key} scope="col" className="whitespace-nowrap bg-default-100 px-4 py-3 text-left text-xs font-bold uppercase text-default-600">
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
                                return <td key={column.key} className="whitespace-nowrap px-4 py-3">{val ? (val * 100).toFixed(2) + "%" : "-"}</td>;
                            }
                            if (column.key === "mod_name") {
                                return (
                                    <td key={column.key} className="whitespace-nowrap px-4 py-3">
                                        <Chip size="sm" color={getModColor(val).color} variant="soft">{val}</Chip>
                                    </td>
                                );
                            }
                            return <td key={column.key} className="whitespace-nowrap px-4 py-3">{val ?? "-"}</td>;
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

// --- 子组件 3: 地图成绩网格 ---
const MapScoresGrid = ({ stage, round, scores, players }: { stage: Stage[], round: TournamentRoundInfo, scores: Score[], players?: Player[] }) => {
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
        // 使用 CSS Grid 替代原来的 flex-reverse hack
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {allMaps.map((map) => (
                <SingleMapCard
                    key={map.map_id}
                    map={map}
                    roundName={round.stage_name}
                    scores={scores}
                    players={players}
                />
            ))}
        </div>
    );
};

// --- 子组件 4: 单个地图成绩卡片 ---
const SingleMapCard = ({ map, roundName, scores, players }: { map: any, roundName: string, scores: Score[], players?: Player[] }) => {
    const modColor = getModColor(map.mod);

    // 过滤并排序成绩
    const mapScores = useMemo(() => {
        return scores
            .filter(s => s.stage_name === roundName && s.map_id === map.map_id)
            .sort((a, b) => b.score - a.score);
    }, [scores, roundName, map.map_id]);

    // 检查是否有特定 Mod 要求 (Logic from original code)
    const isContainMods = useMemo(() => {
        return mapScores.some(score => (score.mod ?? []).some(m => m !== 'NF' && m !== map.mod));
    }, [mapScores, map.mod]);
    const scoreGridClass = isContainMods
        ? "grid-cols-[40px_minmax(0,1fr)_64px_120px]"
        : "grid-cols-[40px_minmax(0,1fr)_120px]";

    return (
        <Card
            className="flex h-[500px] flex-col overflow-hidden border border-zinc-200 bg-white !p-0 shadow-lg dark:border-white/5 dark:bg-zinc-900"
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
                            {map.mod} {map.index + 1}
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
                {mapScores.length > 0 ? (
                    <div className="flex flex-col">
                        {/* 表头 */}
                        <div className={`grid ${scoreGridClass} sticky top-0 z-30 gap-2 border-b border-zinc-200 bg-zinc-100 p-3 text-xs font-bold text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-800`}>
                            <div className="text-center">#</div>
                            <div>Player</div>
                            {isContainMods && <div className="text-center">Mods</div>}
                            <div className="text-right pr-2">Score / Acc</div>
                        </div>

                        {/* 列表内容 */}
                        {mapScores.map((score, idx) => {
                            const player = players?.find(p => p.uid.toString() === score.player);
                            return (
                                <div key={idx} className={`grid ${scoreGridClass} items-center gap-2 border-b border-zinc-200/70 p-3 text-sm transition-colors last:border-b-0 hover:bg-zinc-100 dark:border-white/[0.06] dark:hover:bg-white/5`}>
                                    <div className={`text-center font-bold ${idx < 3 ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Avatar size="sm" className="hidden sm:flex">
                                                <Avatar.Image src={`https://a.ppy.sh/${player?.uid ?? ""}`} alt={player?.name || score.player}/>
                                                <Avatar.Fallback>{(player?.name || score.player)?.[0] ?? "?"}</Avatar.Fallback>
                                            </Avatar>
                                            <span className="truncate text-small font-medium text-zinc-900 dark:text-zinc-100">
                                                {player?.name || score.player}
                                            </span>
                                        </div>
                                    </div>

                                    {isContainMods && (
                                        <div className="text-center text-xs text-warning">
                                            {(score.mod ?? []).filter((m) => m !== 'NF' && m !== map.mod).join('')}
                                        </div>
                                    )}

                                    <div className="text-right pr-2">
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

interface Score {
    tournament_name: string;
    stage_name: string;
    map_id: string;
    player: string;
    score: number;
    acc: number;
    mod: string[];
}
