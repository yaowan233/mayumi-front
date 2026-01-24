"use client";

import React, { useContext, useEffect, useState } from "react";
import { TournamentRoundInfo } from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import { Button } from "@heroui/button";
import { siteConfig } from "@/config/site";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Link } from "@heroui/link";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@heroui/modal";
import { Input } from "@heroui/input";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell
} from "@heroui/table";
import { Chip } from "@heroui/chip";

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
    const [selectedRound, setSelectedRound] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Score Management State
    const [allScores, setAllScores] = useState<TournamentScore[]>([]); // Cache all scores
    const [displayScores, setDisplayScores] = useState<TournamentScore[]>([]); // Filtered scores for current round
    const [isScoresLoading, setIsScoresLoading] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
    const fetchAllScores = async () => {
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
    };

    // Initial fetch of scores
    useEffect(() => {
        fetchAllScores();
    }, [tournament_name]);

    // Filter scores when selectedRound or allScores changes
    useEffect(() => {
        if (!selectedRound) {
            setDisplayScores([]);
            return;
        }
        const filtered = allScores.filter(s => s.stage_name === selectedRound);
        setDisplayScores(filtered);
    }, [selectedRound, allScores]);


    const handleUpdateStats = async () => {
        if (!selectedRound) return;

        setIsUpdating(true);
        try {
            const res = await fetch(siteConfig.backend_url + `/api/get-stage-plays?tournament_name=${tournament_name}&stage_name=${selectedRound}`,
                { next: { revalidate: 0 } })

            if (res.status != 200) {
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
        return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg" color="primary" />
        </div>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in">

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
                        aria-label="Rounds"
                        items={roundInfo}
                        selectedKey={selectedRound}
                        onSelectionChange={(key) => setSelectedRound(key as string)}
                        variant="underlined"
                        color="primary"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-default-200 dark:border-white/10",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary font-bold text-lg"
                        }}
                    >
                        {(item) => <Tab key={item.stage_name} title={item.stage_name} />}
                    </Tabs>

                    {/* 2. Action Card: Fetch Metadata */}
                    <Card
                        className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 shadow-sm">
                        <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <RefreshIcon />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-bold text-foreground">更新 {selectedRound} 数据</h3>
                                <p className="text-sm text-default-500">从 Bancho 同步最新成绩</p>
                            </div>
                        </CardHeader>

                        <CardBody className="px-6 py-4 gap-6">
                            <div
                                className="flex items-start gap-3 p-4 rounded-xl bg-default-100 dark:bg-white/5 text-default-600 text-sm leading-relaxed border border-default-200 dark:border-white/5">
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

                            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                <Button
                                    color="primary"
                                    size="lg"
                                    variant="shadow"
                                    className="font-bold w-full sm:w-auto px-8"
                                    startContent={!isUpdating && <RefreshIcon />}
                                    isLoading={isUpdating}
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
                        </CardBody>
                    </Card>

                    {/* 3. Score Management Card */}
                    <Card className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 shadow-sm">
                        <CardHeader className="flex justify-between items-center px-6 pt-6 pb-2">
                            <div className="flex gap-3 items-center">
                                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                                    <EditIcon />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold text-foreground">成绩管理</h3>
                                    <p className="text-sm text-default-500">手动添加或删除该轮次的成绩</p>
                                </div>
                            </div>
                            <Button
                                onPress={onOpen}
                                color="secondary"
                                variant="flat"
                                startContent={<PlusIcon />}
                                className="font-bold"
                            >
                                添加成绩
                            </Button>
                        </CardHeader>

                        <CardBody className="px-6 py-4">
                            <Table
                                aria-label="Score List"
                                classNames={{
                                    wrapper: "shadow-sm border border-default-200 dark:border-white/5 bg-content1",
                                    th: "bg-default-100 text-default-600 font-bold uppercase text-xs",
                                    td: "whitespace-nowrap"
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>MAP ID</TableColumn>
                                    <TableColumn>PLAYER (UID)</TableColumn>
                                    <TableColumn>SCORE</TableColumn>
                                    <TableColumn>ACC</TableColumn>
                                    <TableColumn>COMBO</TableColumn>
                                    <TableColumn>MISS</TableColumn>
                                    <TableColumn>MODS</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody
                                    items={displayScores}
                                    emptyContent={isScoresLoading ? <Spinner /> : "暂无成绩数据"}
                                    isLoading={isScoresLoading}
                                >
                                    {(item) => (
                                        <TableRow key={`${item.map_id}-${item.player}-${item.start_time}`}>
                                            <TableCell className="font-mono">{item.map_id}</TableCell>
                                            <TableCell>{item.player}</TableCell>
                                            <TableCell>{item.score.toLocaleString()}</TableCell>
                                            <TableCell>{(item.acc * 100).toFixed(2)}%</TableCell>
                                            <TableCell>{item.max_combo}</TableCell>
                                            <TableCell>{item.miss}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {Array.isArray(item.mod) && item.mod.map((m, i) => (
                                                        <Chip key={i} size="sm" variant="flat">{m}</Chip>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => handleDeleteScore(item)}
                                                >
                                                    <TrashIcon />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>

                    {/* Add Score Modal */}
                    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
                        <ModalContent>
                            {(onClose) => (
                                <>
                                    <ModalHeader className="flex flex-col gap-1">添加新成绩</ModalHeader>
                                    <ModalBody>
                                        <Input
                                            autoFocus
                                            label="Map ID"
                                            placeholder="e.g. 123456"
                                            variant="bordered"
                                            type="number"
                                            value={newScore.map_id?.toString() || ''}
                                            onValueChange={(v) => setNewScore({ ...newScore, map_id: parseInt(v) })}
                                        />
                                        <Input
                                            label="Player UID"
                                            placeholder="e.g. 12345"
                                            variant="bordered"
                                            value={newScore.player || ''}
                                            onValueChange={(v) => setNewScore({ ...newScore, player: v })}
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                label="Score"
                                                type="number"
                                                variant="bordered"
                                                value={newScore.score?.toString() || ''}
                                                onValueChange={(v) => setNewScore({ ...newScore, score: parseInt(v) })}
                                            />
                                            <Input
                                                label="Acc (%)"
                                                type="number"
                                                variant="bordered"
                                                placeholder="99.5"
                                                value={newScore.acc?.toString() || ''}
                                                onValueChange={(v) => setNewScore({ ...newScore, acc: parseFloat(v) })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                label="Max Combo"
                                                type="number"
                                                variant="bordered"
                                                value={newScore.max_combo?.toString() || ''}
                                                onValueChange={(v) => setNewScore({ ...newScore, max_combo: parseInt(v) })}
                                            />
                                            <Input
                                                label="Miss"
                                                type="number"
                                                variant="bordered"
                                                value={newScore.miss?.toString() || ''}
                                                onValueChange={(v) => setNewScore({ ...newScore, miss: parseInt(v) })}
                                            />
                                        </div>
                                        <Select
                                            label="Mods"
                                            placeholder="Select mods"
                                            variant="bordered"
                                            selectionMode="multiple"
                                            selectedKeys={new Set(newScore.mod)}
                                            onSelectionChange={(keys) => {
                                                const selectedMods = Array.from(keys).map(k => k.toString());
                                                setNewScore({ ...newScore, mod: selectedMods });
                                            }}
                                        >
                                            {AVAILABLE_MODS.map((mod) => (
                                                <SelectItem key={mod.value}>
                                                    {mod.value}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button color="danger" variant="light" onPress={onClose}>
                                            取消
                                        </Button>
                                        <Button color="primary" onPress={() => handleAddScore(onClose)} isLoading={isSavingScore}>
                                            添加
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}
                        </ModalContent>
                    </Modal>

                </div>
            ) : (
                // 空状态
                <div
                    className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-white/10 rounded-xl">
                    <p className="text-default-500">暂无轮次信息，请先前往“轮次管理”添加。</p>
                    <Button as={Link} href={`/tournament-management/${tournament_name}/round`} color="primary"
                        className="mt-4" variant="flat">
                        去添加轮次
                    </Button>
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