"use client";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TournamentRoundInfo } from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {Button, Card, Chip, Spinner, Tabs} from "@heroui/react";
import { siteConfig } from "@/config/site";
import Link from "next/link";

// --- 图标 ---
const DataIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>);
const RefreshIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>);
const InfoIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>);
const PlusIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>);
const TrashIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>);
const EditIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

const AVAILABLE_MODS = [
    { label: "No Fail", value: "NF" },
    { label: "Easy", value: "EZ" },
    { label: "Hidden", value: "HD" },
    { label: "Hard Rock", value: "HR" },
    { label: "Sudden Death", value: "SD" },
    { label: "Double Time", value: "DT" },
    { label: "Half Time", value: "HT" },
    { label: "Night Core", value: "NC" },
    { label: "Flashlight", value: "FL" },
    { label: "Spun Out", value: "SO" },
    { label: "Perfect", value: "PF" },
];

interface TournamentScore {
    tournament_name: string;
    stage_name: string;
    map_id: number;
    player: string; // UID
    start_time: string;
    mod: string[];
    score: number;
    acc: number;
    miss: number;
    max_combo: number;
}

export default function EditStatisticsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);

    // Round Info State
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [selectedRound, setSelectedRound] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Score Management State
    const [allScores, setAllScores] = useState<TournamentScore[]>([]); // Cache all scores
    const [isScoresLoading, setIsScoresLoading] = useState(false);
    const [isAddScoreOpen, setIsAddScoreOpen] = useState(false);
    const [newScore, setNewScore] = useState<Partial<TournamentScore>>({
        mod: [],
        acc: 100,
        score: 0,
        miss: 0,
        max_combo: 0
    });
    const [isSavingScore, setIsSavingScore] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const data = await getRoundInfo(tournament_name);
                    setRoundInfo(data);
                    if (data.length > 0) {
                        setSelectedRound(data[data.length - 1].stage_name);
                    }
                } catch (e) {
                    console.error("Failed to load rounds", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    // Fetch ALL scores for the tournament (Cache)
    const fetchAllScores = useCallback(async () => {
        setIsScoresLoading(true);
        try {
            const res = await fetch(siteConfig.backend_url + `/api/scores?tournament_name=${tournament_name}`);
            if (res.ok) {
                const data = await res.json();
                setAllScores(data);
            } else {
                setAllScores([]);
            }
        } catch (e) {
            console.error("Failed to load scores", e);
            setAllScores([]);
        } finally {
            setIsScoresLoading(false);
        }
    }, [tournament_name]);

    // Initial fetch of scores
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchAllScores();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchAllScores]);

    const displayScores = useMemo(
        () => selectedRound ? allScores.filter((score) => score.stage_name === selectedRound) : [],
        [allScores, selectedRound]
    );


    const handleUpdateStats = async () => {
        if (!selectedRound) return;

        setIsUpdating(true);
        try {
            const res = await fetch(
                siteConfig.backend_url + `/api/get-stage-plays?tournament_name=${encodeURIComponent(tournament_name)}&stage_name=${encodeURIComponent(selectedRound)}`,
                { method: 'POST', credentials: 'include', next: { revalidate: 0 } }
            )

            if (!res.ok) {
                alert(`更新失败: ${await res.text()}`);
            } else {
                alert('数据更新成功！排行榜和统计数据已刷新。');
                // Refresh scores
                await fetchAllScores();
            }
        } catch (e) {
            alert("网络请求失败");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddScore = async (onClose: () => void) => {
        if (!selectedRound || !newScore.player || !newScore.map_id) return;

        setIsSavingScore(true);
        try {
            const scorePayload = {
                ...newScore,
                tournament_name: tournament_name,
                stage_name: selectedRound,
                start_time: newScore.start_time || new Date().toISOString(),
                acc: (newScore.acc || 0) / 100, // Convert to decimal for backend
            };

            // Allow 100% to be 1.0 or 0.99 etc.
            if (scorePayload.acc && scorePayload.acc > 1) {
                scorePayload.acc = scorePayload.acc / 100;
            }

            const res = await fetch(siteConfig.backend_url + "/api/scores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scorePayload),
                credentials: "include"
            });

            if (res.ok) {
                await fetchAllScores(); // Re-fetch all to get the new one
                onClose();
                setNewScore({ mod: [], acc: 100, score: 0, miss: 0, max_combo: 0 }); // Reset
            } else {
                alert("添加失败: " + await res.text());
            }
        } catch (e) {
            alert("添加失败: 网络错误");
        } finally {
            setIsSavingScore(false);
        }
    };

    const handleDeleteScore = async (score: TournamentScore) => {
        if (!confirm("确定要删除这条成绩吗？")) return;
        try {
            const res = await fetch(siteConfig.backend_url + "/api/scores", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(score),
                credentials: "include"
            });

            if (res.ok) {
                await fetchAllScores(); // Re-fetch to sync
            } else {
                alert("删除失败: " + await res.text());
            }
        } catch (e) {
            alert("删除失败");
        }
    };

    if (isLoading) {
        return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg" color="accent" />
        </div>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <DataIcon />
                    数据管理
                </h1>
                <p className="text-default-500">计算并更新比赛的排行榜、Mod 统计及单图成绩。</p>
            </div>

            {/* Content */}
            {roundInfo.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {/* 1. Round Tabs */}
                    <Tabs
                        selectedKey={selectedRound ?? undefined}
                        onSelectionChange={(key) => setSelectedRound(key as string)}
                    >
                        <Tabs.ListContainer className="w-full">
                            <Tabs.List aria-label="Rounds" className="w-full relative !rounded-none !bg-transparent p-0 border-b border-default-200 overflow-x-auto scrollbar-hide flex justify-start dark:border-white/10">
                                {roundInfo.map((item) => (
                                    <Tabs.Tab key={item.stage_name} id={item.stage_name} className="max-w-fit h-12 !rounded-none !bg-transparent px-6 text-lg font-bold text-default-500 transition-colors hover:text-foreground data-[selected=true]:text-primary">
                                        {item.stage_name}
                                        <Tabs.Indicator className="!top-auto !bottom-0 !h-0.5 !rounded-none !bg-primary" />
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </Tabs>

                    {/* 2. Action Card: Fetch Metadata */}
                    <Card
                        className="overflow-hidden rounded-xl border border-default-200 bg-surface shadow-sm dark:border-white/5 dark:bg-zinc-900">
                        <Card.Header className="!flex-row items-start gap-3 px-6 pb-2 pt-6 text-left">
                            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                                <RefreshIcon />
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <h3 className="text-lg font-bold text-foreground">更新 {selectedRound} 数据</h3>
                                <p className="text-sm text-default-500">从 Bancho 同步最新成绩</p>
                            </div>
                        </Card.Header>

                        <Card.Content className="gap-6 px-6 py-4">
                            <div
                                className="flex items-start gap-3 rounded-lg border border-default-200 bg-default-100/70 p-4 text-sm leading-relaxed text-default-600 dark:border-white/5 dark:bg-white/[0.04]">
                                <div className="text-lg mt-0.5 text-primary"><InfoIcon /></div>
                                <div>
                                    <p className="font-bold mb-1">操作说明：</p>
                                    <ul className="list-disc list-inside space-y-1 opacity-80">
                                        <li>请确保 <span className="font-mono text-primary">赛程管理</span> 中该轮次的所有
                                            Match Link (MP 链接) 已填写正确。
                                        </li>
                                        <li>系统将自动抓取 MP 房间内的所有成绩。</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center">
                                <Button
                                    size="lg"
                                    variant="primary"
                                    className="w-full px-8 font-bold sm:w-auto"
                                    isPending={isUpdating}
                                    onPress={handleUpdateStats}
                                >
                                    {isUpdating ? "正在计算数据..." : "立即更新数据"}
                                </Button>

                                {isUpdating && (
                                    <span className="text-xs text-default-400 animate-pulse">
                                        这可能需要几秒钟，请勿关闭页面...
                                    </span>
                                )}
                            </div>
                        </Card.Content>
                    </Card>

                    {/* 3. Score Management Card */}
                    <Card className="overflow-hidden rounded-xl border border-default-200 bg-surface shadow-sm dark:border-white/5 dark:bg-zinc-900">
                        <Card.Header className="!flex-row items-start justify-between gap-4 px-6 pb-2 pt-6 text-left">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                                    <EditIcon />
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <h3 className="text-lg font-bold text-foreground">成绩管理</h3>
                                    <p className="text-sm text-default-500">手动添加或删除该轮次的成绩</p>
                                </div>
                            </div>
                            <Button
                                onPress={() => setIsAddScoreOpen(true)}
                                variant="secondary"
                                className="shrink-0 font-bold"
                            >
                                添加成绩
                            </Button>
                        </Card.Header>

                        <Card.Content className="px-6 pb-6 pt-4">
                            <div className="overflow-x-auto rounded-lg border border-default-200 bg-surface dark:border-white/5">
                                <table className="w-full border-collapse text-sm" aria-label="Score List">
                                    <thead>
                                    <tr>
                                        {['MAP ID', 'PLAYER (UID)', 'SCORE', 'ACC', 'COMBO', 'MISS', 'MODS', 'ACTIONS'].map((column) => (
                                            <th key={column} scope="col" className="whitespace-nowrap bg-default-100 px-4 py-3 text-left text-xs font-bold uppercase text-default-600 dark:bg-white/[0.04]">
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {isScoresLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-10 text-center text-default-500">
                                                <span className="inline-flex items-center gap-2"><Spinner size="sm"/> 加载中...</span>
                                            </td>
                                        </tr>
                                    ) : displayScores.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-10 text-center text-default-400">暂无成绩数据</td>
                                        </tr>
                                    ) : displayScores.map((item) => (
                                        <tr key={`${item.map_id}-${item.player}-${item.start_time}`} className="border-t border-zinc-200/70 transition-colors hover:bg-zinc-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]">
                                            <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-800 dark:text-zinc-100">{item.map_id}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-zinc-800 dark:text-zinc-100">{item.player}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{item.score.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-zinc-800 dark:text-zinc-100">{(item.acc * 100).toFixed(2)}%</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-zinc-800 dark:text-zinc-100">{item.max_combo}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-zinc-800 dark:text-zinc-100">{item.miss}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {Array.isArray(item.mod) && item.mod.map((m: string, i: number) => (
                                                        <Chip key={i} size="sm" variant="soft">{m}</Chip>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button isIconOnly size="sm" variant="danger-soft" onPress={() => handleDeleteScore(item)}>
                                                    <TrashIcon />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Content>
                    </Card>

                    {/* Add Score Modal */}
                    {isAddScoreOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm" onClick={() => setIsAddScoreOpen(false)}>
                            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900" onClick={(event) => event.stopPropagation()}>
                                <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/[0.08]">
                                    <h2 className="text-lg font-bold text-foreground">添加新成绩</h2>
                                </div>
                                <div className="grid gap-4 px-5 py-4">
                                    <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                        Map ID
                                        <input autoFocus className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" placeholder="e.g. 123456" type="number" value={newScore.map_id?.toString() || ''} onChange={(event) => setNewScore({ ...newScore, map_id: parseInt(event.target.value) })}/>
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                        Player UID
                                        <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" placeholder="e.g. 12345" value={newScore.player || ''} onChange={(event) => setNewScore({ ...newScore, player: event.target.value })}/>
                                    </label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                            Score
                                            <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" type="number" value={newScore.score?.toString() || ''} onChange={(event) => setNewScore({ ...newScore, score: parseInt(event.target.value) })}/>
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                            Acc (%)
                                            <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" type="number" placeholder="99.5" value={newScore.acc?.toString() || ''} onChange={(event) => setNewScore({ ...newScore, acc: parseFloat(event.target.value) })}/>
                                        </label>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                            Max Combo
                                            <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" type="number" value={newScore.max_combo?.toString() || ''} onChange={(event) => setNewScore({ ...newScore, max_combo: parseInt(event.target.value) })}/>
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                            Miss
                                            <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100" type="number" value={newScore.miss?.toString() || ''} onChange={(event) => setNewScore({ ...newScore, miss: parseInt(event.target.value) })}/>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                        Mods
                                        <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-300 bg-white p-3 dark:border-white/10 dark:bg-black/20">
                                            {AVAILABLE_MODS.map((mod) => {
                                                const selectedMods = newScore.mod || [];
                                                const isSelected = selectedMods.includes(mod.value);

                                                return (
                                                    <button
                                                        key={mod.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewScore({
                                                                ...newScore,
                                                                mod: isSelected
                                                                    ? selectedMods.filter((value) => value !== mod.value)
                                                                    : [...selectedMods, mod.value],
                                                            });
                                                        }}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                                            isSelected
                                                                ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                                                                : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-primary"
                                                        }`}
                                                    >
                                                        {mod.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-white/[0.08]">
                                    <Button variant="danger-soft" onPress={() => setIsAddScoreOpen(false)}>
                                        取消
                                    </Button>
                                    <Button variant="primary" onPress={() => handleAddScore(() => setIsAddScoreOpen(false))} isPending={isSavingScore}>
                                        {({isPending}) => isPending ? "添加中..." : "添加"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                // 空状态
                <div
                    className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-white/10 rounded-xl">
                    <p className="text-default-500">暂无轮次信息，请先前往“轮次管理”添加。</p>
                    <Link href={`/tournament-management/${tournament_name}/round`} className="mt-4 no-underline"><Button variant="primary">去添加轮次</Button></Link>
                </div>
            )}
        </div>
    )
}

// API
async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 } });
    return await data.json();
}
