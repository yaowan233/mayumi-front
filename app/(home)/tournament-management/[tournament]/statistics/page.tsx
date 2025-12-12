"use client";

import React, {useContext, useEffect, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {Button} from "@heroui/button";
import {siteConfig} from "@/config/site";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {Tab, Tabs} from "@heroui/tabs";
import {Spinner} from "@heroui/spinner";
import {Link} from "@heroui/link";

// --- 图标 ---
const DataIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>);
const RefreshIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>);
const InfoIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>);

export default function EditStatisticsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);

    // State
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [selectedRound, setSelectedRound] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleUpdateStats = async () => {
        if (!selectedRound) return;

        setIsUpdating(true);
        try {
            const res = await fetch(siteConfig.backend_url + `/api/get-stage-plays?tournament_name=${tournament_name}&stage_name=${selectedRound}`,
                {next: {revalidate: 0}})

            if (res.status != 200) {
                alert(`更新失败: ${await res.text()}`);
            } else {
                alert('数据更新成功！排行榜和统计数据已刷新。');
            }
        } catch (e) {
            alert("网络请求失败");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg" color="primary"/>
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
                    <DataIcon/>
                    数据管理
                </h1>
                <p className="text-default-500">计算并更新比赛的排行榜、Mod 统计及单图成绩。</p>
            </div>

            {/* Content */}
            {roundInfo.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {/* 1. Round Tabs (保持与其他页面一致的交互) */}
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
                        {(item) => <Tab key={item.stage_name} title={item.stage_name}/>}
                    </Tabs>

                    {/* 2. Action Card */}
                    <Card
                        className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 shadow-sm">
                        <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <RefreshIcon/>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-bold text-foreground">更新 {selectedRound} 数据</h3>
                                <p className="text-sm text-default-500">从 Bancho 同步最新成绩</p>
                            </div>
                        </CardHeader>

                        <CardBody className="px-6 py-4 gap-6">
                            {/* 提示信息 */}
                            <div
                                className="flex items-start gap-3 p-4 rounded-xl bg-default-100 dark:bg-white/5 text-default-600 text-sm leading-relaxed border border-default-200 dark:border-white/5">
                                <div className="text-lg mt-0.5 text-primary"><InfoIcon/></div>
                                <div>
                                    <p className="font-bold mb-1">操作说明：</p>
                                    <ul className="list-disc list-inside space-y-1 opacity-80">
                                        <li>请确保 <span className="font-mono text-primary">赛程管理</span> 中该轮次的所有
                                            Match Link (MP 链接) 已填写正确。
                                        </li>
                                        <li>系统将自动抓取 MP 房间内的所有成绩，计算 PP、Accuracy 并生成排行榜。</li>
                                        <li>如果数据有误，请检查 MP 链接是否正确或联系网站管理员。</li>
                                    </ul>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                <Button
                                    color="primary"
                                    size="lg"
                                    variant="shadow"
                                    className="font-bold w-full sm:w-auto px-8"
                                    startContent={!isUpdating && <RefreshIcon/>}
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
        {next: {revalidate: 10}});
    return await data.json();
}