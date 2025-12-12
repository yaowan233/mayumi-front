"use client";
import React, { useContext, useEffect, useState } from "react";
import CurrentUserContext from "@/app/user_context";
import { siteConfig } from "@/config/site";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";

const SaveIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const PlusIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const RoundIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);

export default function EditRoundPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();

    const [formData, setFormData] = useState<TournamentRoundInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const initialFormData: TournamentRoundInfo = {
        tournament_name: tournament_name,
        stage_name: '',
        start_time: undefined,
        end_time: undefined,
        is_lobby: false
    };

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const data = await getRoundInfo(tournament_name);
                    setFormData(data.length > 0 ? data : [initialFormData]);
                } catch (e) {
                    setErrMsg("加载失败，请刷新重试");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const handleUpdateTournament = async () => {
        setErrMsg('');
        if (!formData.every(round => round.stage_name && round.start_time)) {
            setErrMsg('请填写所有轮次的名称和开始时间');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-tournament-round-info', {
                'method': 'POST',
                'body': JSON.stringify(formData),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            })
            if (res.status != 200) {
                setErrMsg(await res.text());
            } else {
                alert('修改成功');
                router.refresh();
            }
        } catch (e) {
            setErrMsg("保存失败，网络错误");
        } finally {
            setIsSaving(false);
        }
    }

    const updateRound = (index: number, newData: TournamentRoundInfo) => {
        const newFormData = [...formData];
        newFormData[index] = newData;
        setFormData(newFormData);
    };

    const removeRound = (index: number) => {
        const newFormData = [...formData];
        newFormData.splice(index, 1);
        setFormData(newFormData);
    };

    if (isLoading) {
        return (
            <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="primary" />
                <p className="text-default-500">正在加载轮次信息...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in pb-32">

            {/* Header: 修复边框颜色 */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                {/* 修复：text-white -> text-foreground */}
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <RoundIcon />
                    轮次管理
                </h1>
                <p className="text-default-500">配置比赛的各个阶段（如：预选赛、小组赛、淘汰赛）及其时间安排。</p>
            </div>

            {/* Form List */}
            <div className="flex flex-col gap-6">
                {formData.map((round, index) => (
                    <RoundCard
                        key={index}
                        index={index}
                        roundData={round}
                        onChange={(newData) => updateRound(index, newData)}
                        onDelete={() => removeRound(index)}
                    />
                ))}

                {/* Add Button: 修复 hover 效果和边框颜色 */}
                <button
                    onClick={() => setFormData([...formData, initialFormData])}
                    className="w-full h-16 border-2 border-dashed border-default-300 rounded-2xl flex items-center justify-center gap-2 text-default-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                >
                    <PlusIcon />
                    <span className="font-bold group-hover:tracking-wider transition-all">添加新轮次</span>
                </button>
            </div>

            {/* Sticky Footer: 修复背景色和边框 */}
            <Card className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="light" onPress={() => router.back()}>取消</Button>
                        <div className="text-danger font-medium text-sm animate-pulse">
                            {errMsg && <span>⚠️ {errMsg}</span>}
                        </div>
                    </div>
                    <Button
                        color="primary"
                        size="lg"
                        variant="shadow"
                        className="font-bold px-8 shadow-primary/20"
                        startContent={!isSaving && <SaveIcon />}
                        isLoading={isSaving}
                        onPress={handleUpdateTournament}
                    >
                        {isSaving ? "正在保存..." : "保存修改"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

// --- 子组件：轮次卡片 (UI 适配核心) ---
interface RoundCardProps {
    index: number;
    roundData: TournamentRoundInfo;
    onChange: (data: TournamentRoundInfo) => void;
    onDelete: () => void;
}

const RoundCard = ({ index, roundData, onChange, onDelete }: RoundCardProps) => {
    return (
        <Card
            // 修复：
            // 1. bg-zinc-900/50 -> bg-content1 (亮色为白，暗色为深灰)
            // 2. border-white/5 -> border-default-200 dark:border-white/5 (亮色用淡灰边框)
            className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900/50 transition-colors shadow-sm"
        >
            {/* Header: 修复背景色和边框 */}
            <CardHeader className="flex justify-between items-center px-6 py-4 bg-default-50 dark:bg-white/5 border-b border-default-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        {index + 1}
                    </div>
                    {/* 修复：text-default-700 -> text-foreground */}
                    <span className="font-bold text-foreground">
                        {roundData.stage_name || "新轮次"}
                    </span>
                </div>
                <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={onDelete}
                    className="opacity-50 hover:opacity-100"
                >
                    <TrashIcon />
                </Button>
            </CardHeader>

            <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                    {/* 第一行：轮次名称 */}
                    <div className="lg:col-span-4">
                        <Input
                            label="轮次名称"
                            placeholder="例如：Qualifiers / Round of 16"
                            value={roundData.stage_name}
                            isRequired
                            variant="bordered"
                            labelPlacement="outside"
                            onChange={e => onChange({...roundData, stage_name: e.target.value})}
                        />
                    </div>

                    {/* 第二行：时间范围 */}
                    <div className="lg:col-span-3">
                        <Input
                            type="date"
                            label="开始日期"
                            isRequired
                            value={roundData.start_time || ''}
                            variant="bordered"
                            labelPlacement="outside"
                            onChange={e => onChange({...roundData, start_time: e.target.value})}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <Input
                            type="date"
                            label="结束日期"
                            placeholder="可选"
                            value={roundData.end_time || ''}
                            variant="bordered"
                            labelPlacement="outside"
                            onChange={e => onChange({...roundData, end_time: e.target.value})}
                        />
                    </div>

                    {/* 第三行：开关 */}
                    <div className="lg:col-span-2 flex items-end h-full pb-2">
                        <div className="flex flex-col gap-2">
                            <span className="text-small text-default-500">类型设置</span>
                            <Switch
                                isSelected={roundData.is_lobby}
                                size="sm"
                                color="success"
                                classNames={{
                                    wrapper: "group-data-[selected=true]:bg-success",
                                }}
                                onChange={e => onChange({...roundData, is_lobby: e.target.checked})}
                            >
                                <span className="text-small text-foreground">小组赛 (Lobby)</span>
                            </Switch>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

export interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}