"use client"

import {Tab, Tabs} from "@heroui/tabs";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {Link} from "@heroui/link";
import {Image} from "@heroui/image";
import React, {useEffect, useMemo, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Stage} from "@/components/mappools";
import {useRouter, useSearchParams} from "next/navigation";
import {Chip} from "@heroui/chip";
import {Player} from "@/app/tournaments/[tournament]/participants/page";
import {siteConfig} from "@/config/site";
import {Spinner} from "@heroui/spinner";
import {User} from "@heroui/user";

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

    const map: Record<string, { color: "default" | "primary" | "secondary" | "success" | "warning" | "danger", hex: string }> = {
        "RC": { color: "primary", hex: "#006FEE" },   // Blue (Rice)
        "SV": { color: "secondary", hex: "#9353d3" }, // Purple (Long Note)
        "HB": { color: "warning", hex: "#f5a524" },   // Orange/Gold (Hybrid)
        "LN": { color: "success", hex: "#17c964" },   // Green (Slider Velocity)
        "TB": { color: "danger", hex: "#f31260" },    // Red (Tiebreaker)
        "NM": { color: "default", hex: "#a1a1aa" },
        "HD": { color: "warning", hex: "#f5a524" },
        "HR": { color: "primary", hex: "#006FEE" },
        "DT": { color: "secondary", hex: "#9353d3" },
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
            {/* 修复：移除了外层的 flex justify-center，让它自然占满全宽 */}
            <div className="w-full">
                <Tabs
                    aria-label="Round Selection"
                    // 修复关键：移除了 max-w-4xl，改为 w-full
                    className="w-full"
                    size="lg"
                    variant="underlined"
                    color="primary"
                    classNames={{
                        // 这里的 border-b 会跟随上面的 className="w-full" 撑满整个屏幕
                        tabList: "w-full relative rounded-none p-0 border-b border-divider overflow-x-auto scrollbar-hide flex justify-start md:justify-center",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-6 h-12",
                        tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-bold text-lg",
                        panel: "pt-6 w-full"
                    }}
                    selectedKey={currentStageName}
                    onSelectionChange={(key) => router.replace(`?stage=${key}`)}
                >
                    {roundInfo.map((round) => (
                        <Tab key={round.stage_name} title={round.stage_name} />
                    ))}
                </Tabs>
            </div>

            {/* 2. 内容区域 */}
            {currentRound && (
                // 优化：虽然 Tab 线撑满了，但下方内容建议加一个 max-w 限制 (如 1400px)，
                // 防止表格在 4K 屏幕上拉得过长难以阅读。同时用 mx-auto 居中。
                <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto px-4">
                    {currentRound.is_lobby && (
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

    // 计算每一列的前三名数值
    const top3Data = useMemo(() => {
        if (leaderboard.length === 0) return {};
        const columns = Object.keys(leaderboard[0]);
        const result: Record<string, number[]> = {};

        columns.forEach(col => {

            if (col === 'name' || col === '#') return;

            // 提取该列所有数值 (过滤掉非数字)
            const values = leaderboard.map(row => parseFloat(row[col])).filter(v => !isNaN(v));

            if (values.length === 0) return;

            // 去重
            const uniqueValues = Array.from(new Set(values));

            const isScore = col.includes('分') || col.includes('成绩') || col.includes('Score') || col.includes('Acc');

            uniqueValues.sort((a, b) => isScore ? b - a : a - b);

            // 取前三名
            result[col] = uniqueValues.slice(0, 3);
        });

        return result;
    }, [leaderboard]);

    // 获取样式函数
    const getCellStyle = (columnKey: string, value: any) => {
        // --- 修复点 2: 如果是 NAME 列，直接返回空样式，保持原样 ---
        if (columnKey === 'NAME' || columnKey === '#') return "";

        const numericVal = parseFloat(value);
        if (isNaN(numericVal) || !top3Data[columnKey]) return "";

        const rankIndex = top3Data[columnKey].indexOf(numericVal);

        // 金牌
        if (rankIndex === 0) return "text-yellow-400 font-black drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]";
        // 银牌 (使用亮白色)
        if (rankIndex === 1) return "text-white font-extrabold drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]";
        // 铜牌 (使用橙色)
        if (rankIndex === 2) return "text-orange-400 font-bold";

        // --- 修复点 3: 其他分数不再变灰，返回空字符串使用默认颜色 ---
        return "";
    };

    if (loading) return <div className="w-full h-40 flex justify-center items-center"><Spinner label="加载排行榜..." /></div>;
    if (leaderboard.length === 0) return <div className="text-default-400 p-4">暂无排行数据</div>;

    const columns = Object.keys(leaderboard[0] || {});

    return (
        <Table
            aria-label="Leaderboard"
            classNames={{
                wrapper: "min-h-[200px] shadow-sm border border-white/5 bg-content1 overflow-x-auto",
                th: "bg-default-100 text-default-600 font-bold uppercase text-xs whitespace-nowrap",
                td: "whitespace-nowrap"
            }}
            isStriped
        >
            <TableHeader>
                {columns.map((column) => (
                    <TableColumn key={column} className="uppercase">{column}</TableColumn>
                ))}
            </TableHeader>
            <TableBody items={leaderboard.map((row, i) => ({...row, key: i}))}>
                {(item) => (
                    <TableRow key={item.key}>
                        {(columnKey) => {
                            const val = getKeyValue(item, columnKey);
                            const style = getCellStyle(columnKey.toString(), val);
                            return (
                                <TableCell>
                                    <span className={style}>{val ?? '-'}</span>
                                </TableCell>
                            );
                        }}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

// --- 子组件 2: 统计表格 ---
const StatsTable = ({ stats, stageName }: { stats: Stats[], stageName: string }) => {
    const currentStats = useMemo(() => stats.filter(s => s.stage_name === stageName), [stats, stageName]);

    return (
        <Table aria-label="Map Stats">
            <TableHeader columns={STATS_COLUMNS}>
                {(column) => <TableColumn key={column.key}>{column.name}</TableColumn>}
            </TableHeader>
            <TableBody items={currentStats} emptyContent={"暂无统计数据"}>
                {(item) => (
                    <TableRow key={item.mod_name}>
                        {(columnKey) => {
                            const val = getKeyValue(item, columnKey);
                            if (['acc_max', 'acc_min', 'acc_avg'].includes(columnKey as string)) {
                                return <TableCell>{val ? (val * 100).toFixed(2) + "%" : '-'}</TableCell>;
                            }
                            // 给 Mod 列加个高亮
                            if (columnKey === 'mod_name') {
                                return <TableCell><Chip size="sm" color={getModColor(val).color} variant="flat">{val}</Chip></TableCell>
                            }
                            return <TableCell>{val ?? '-'}</TableCell>;
                        }}
                    </TableRow>
                )}
            </TableBody>
        </Table>
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
        return mapScores.some(score => score.mod.some(m => m !== 'NF' && m !== map.mod));
    }, [mapScores, map.mod]);

    return (
        <Card
            className="h-[500px] flex flex-col border border-default-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-lg"
        >
            {/* 1. 地图头部信息 */}
            <CardHeader className="p-0 relative h-[140px] shrink-0 overflow-hidden z-0">
                <Image
                    removeWrapper
                    src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
                    alt="bg"
                    className="w-full h-full object-cover opacity-90 dark:opacity-60 z-0"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <Chip color={modColor.color} variant="solid" size="sm" className="font-bold shadow-md text-white">
                            {map.mod} {map.index + 1}
                        </Chip>
                        <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs text-yellow-400 font-bold border border-white/20">
                            ★ {map.star_rating}
                        </div>
                    </div>

                    <div>
                        <Link isExternal href={`https://osu.ppy.sh/b/${map.map_id}`} className="text-white font-bold line-clamp-1 hover:text-primary transition-colors text-lg">
                            {map.map_name}
                        </Link>
                        <div className="flex justify-between text-xs text-gray-300 mt-1">
                            <span>{map.diff_name}</span>
                            <span>by {map.mapper}</span>
                        </div>
                    </div>
                </div>

                {/* 侧边装饰条 */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 z-20 bg-${modColor.color === 'default' ? 'zinc-500' : modColor}`} />
            </CardHeader>

            {/* 2. 成绩列表区域 */}
            <CardBody className="p-0 overflow-y-auto scrollbar-hide bg-content1/50 dark:bg-transparent">
                {mapScores.length > 0 ? (
                    <div className="flex flex-col">
                        {/* 表头 */}
                        <div className="grid grid-cols-[40px_1fr_auto_auto] gap-2 p-3 text-xs font-bold text-default-500 bg-default-100 dark:bg-content2 sticky top-0 z-30 border-b border-divider">
                            <div className="text-center">#</div>
                            <div>Player</div>
                            {isContainMods && <div className="text-center">Mods</div>}
                            <div className="text-right pr-2">Score / Acc</div>
                        </div>

                        {/* 列表内容 */}
                        {mapScores.map((score, idx) => {
                            const player = players?.find(p => p.uid.toString() === score.player);
                            return (
                                <div key={idx} className="grid grid-cols-[40px_1fr_auto_auto] gap-2 p-3 border-b border-divider/50 hover:bg-default-100 dark:hover:bg-white/5 transition-colors items-center text-sm">
                                    <div className={`text-center font-bold ${idx < 3 ? 'text-primary' : 'text-default-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <User
                                            name={player?.name || score.player}
                                            avatarProps={{
                                                src: `https://a.ppy.sh/${player?.uid}` || "https://a.ppy.sh",
                                                size: "sm",
                                                className: "hidden sm:flex"
                                            }}
                                            classNames={{
                                                // 修复 4: 名字颜色使用默认的前景色
                                                name: "truncate font-medium text-small text-foreground",
                                            }}
                                        />
                                    </div>

                                    {isContainMods && (
                                        <div className="text-center text-xs text-warning">
                                            {score.mod.filter((m) => m !== 'NF' && m !== map.mod).join('')}
                                        </div>
                                    )}

                                    <div className="text-right pr-2">
                                        {/* 修复 5: 分数颜色 */}
                                        <div className="font-mono font-bold text-foreground">{score.score.toLocaleString()}</div>
                                        <div className={`text-xs ${score.acc === 1 ? 'text-success' : 'text-default-400'}`}>
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
            </CardBody>
        </Card>
    )
}

// 类型定义保持不变
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