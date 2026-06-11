"use client";
import React, {useCallback, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {Button, Card, FieldError, Input, Label, Spinner, Switch, TextField} from "@heroui/react";
import {useRouter} from "next/navigation";
import {TournamentInfo} from "@/components/homepage";

const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>);
const PlusIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>);
const TrashIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>);
const RoundIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>);

export default function EditRoundPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();

    const [formData, setFormData] = useState<TournamentRoundInfo[]>([]);
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const createInitialFormData = useCallback((): TournamentRoundInfo => ({
        tournament_name: tournament_name,
        stage_name: '',
        start_time: undefined,
        end_time: undefined,
        is_lobby: false
    }), [tournament_name]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const [data, info] = await Promise.all([
                        getRoundInfo(tournament_name),
                        getTournamentInfo(tournament_name),
                    ]);
                    setFormData(data.length > 0 ? data : [createInitialFormData()]);
                    setTournamentInfo(info);
                } catch (e) {
                    setErrMsg("加载失败，请刷新重试");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name, createInitialFormData]);

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
                <Spinner size="lg" color="accent"/>
                <p className="text-default-500">正在加载轮次信息...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">

            {/* Header: 修复边框颜色 */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                {/* 修复：text-white -> text-foreground */}
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <RoundIcon/>
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
                        isGroup={tournamentInfo?.is_group ?? false}
                        onChange={(newData) => updateRound(index, newData)}
                        onDelete={() => removeRound(index)}
                    />
                ))}

                {/* Add Button: 修复 hover 效果和边框颜色 */}
                <Button
                    fullWidth
                    variant="outline"
                    onPress={() => setFormData((prev) => [...prev, createInitialFormData()])}
                    className="h-16 border-dashed text-default-500 hover:text-primary"
                >
                    <PlusIcon/>
                    <span className="font-bold">添加新轮次</span>
                </Button>
            </div>

            <Card
                variant="secondary"
                className="sticky bottom-6 z-50 border border-default-200 bg-background/90 backdrop-blur-md shadow-2xl dark:border-white/10 dark:bg-zinc-900/90">
                <Card.Content className="flex flex-row items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onPress={() => router.back()}>取消</Button>
                        <div className="text-danger font-medium text-sm animate-pulse">
                            {errMsg && <span>⚠️ {errMsg}</span>}
                        </div>
                    </div>
                    <Button
                        size="lg"
                        variant="primary"
                        className="font-bold px-8 shadow-primary/20"
                        isPending={isSaving}
                        onPress={handleUpdateTournament}
                    >
                        {({isPending}) => (
                            <>
                                {!isPending && <SaveIcon/>}
                                {isPending ? "正在保存..." : "保存修改"}
                            </>
                        )}
                    </Button>
                </Card.Content>
            </Card>
        </div>
    );
}

// --- 子组件：轮次卡片 (UI 适配核心) ---
interface RoundCardProps {
    index: number;
    roundData: TournamentRoundInfo;
    isGroup: boolean;
    onChange: (data: TournamentRoundInfo) => void;
    onDelete: () => void;
}

const RoundCard = ({index, roundData, isGroup, onChange, onDelete}: RoundCardProps) => {
    return (
        <Card className="transition-colors shadow-sm">
            <Card.Header className="flex flex-row items-center justify-between border-b border-default-200 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {index + 1}
                    </div>
                    <span className="font-bold text-foreground">
                        {roundData.stage_name || "新轮次"}
                    </span>
                </div>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={onDelete}
                    className="text-danger opacity-60 hover:bg-danger/10 hover:opacity-100"
                    aria-label="删除轮次"
                >
                    <TrashIcon/>
                </Button>
            </Card.Header>

            <Card.Content className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4">
                        <TextField isRequired isInvalid={!roundData.stage_name} validationBehavior="aria">
                            <Label>轮次名称</Label>
                            <Input
                                fullWidth
                                variant="secondary"
                                placeholder="例如：Qualifiers / Round of 16"
                                value={roundData.stage_name}
                                onChange={e => onChange({...roundData, stage_name: e.target.value})}
                            />
                            <FieldError>请输入轮次名称</FieldError>
                        </TextField>
                    </div>

                    <div className="lg:col-span-3">
                        <TextField isRequired isInvalid={!roundData.start_time} validationBehavior="aria">
                            <Label>开始日期</Label>
                            <Input
                                fullWidth
                                type="date"
                                variant="secondary"
                                value={roundData.start_time || ''}
                                onChange={e => onChange({...roundData, start_time: e.target.value})}
                            />
                            <FieldError>请输入开始日期</FieldError>
                        </TextField>
                    </div>
                    <div className="lg:col-span-3">
                        <TextField>
                            <Label>结束日期</Label>
                            <Input
                                fullWidth
                                type="date"
                                variant="secondary"
                                value={roundData.end_time || ''}
                                onChange={e => onChange({...roundData, end_time: e.target.value})}
                            />
                        </TextField>
                    </div>

                    <div className="lg:col-span-2 flex h-full items-end">
                        <div className="flex flex-col gap-2">
                            <span className="text-small text-default-500">类型设置</span>
                            <Switch
                                isSelected={roundData.is_lobby}
                                size="sm"
                                onChange={(isSelected) => onChange({...roundData, is_lobby: isSelected})}
                            >
                                <Switch.Control>
                                    <Switch.Thumb/>
                                </Switch.Control>
                                <Label className="text-small text-foreground">小组赛 (Lobby)</Label>
                            </Switch>
                            {isGroup && (
                                <Switch
                                    isSelected={roundData.is_solo_qualifier ?? false}
                                    size="sm"
                                    onChange={(isSelected) => onChange({...roundData, is_solo_qualifier: isSelected})}
                                >
                                    <Switch.Control>
                                        <Switch.Thumb/>
                                    </Switch.Control>
                                    <Label className="text-small text-foreground">单人预选赛</Label>
                                </Switch>
                            )}
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}

export interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
    is_solo_qualifier?: boolean;
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}

async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        {next: {revalidate: 0}});
    return await res.json();
}
