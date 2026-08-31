"use client";
import React, {useCallback, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Button, Card, FieldError, Input, Label, Spinner, Switch, TextField} from "@heroui/react";
import {useRouter} from "next/navigation";
import {TournamentInfo} from "@/components/homepage";
import {canPublishManagedTournament, resolveManagedTournament} from "@/lib/tournament_management";
import {getDraftSection, publishTournamentDraft, saveDraftSection} from "@/lib/tournament_drafts";
import {DraftAction, DraftSaveActions} from "@/components/draft_save_actions";
import {ManagementBackLink} from "@/components/management_back_link";
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
    const tournament_abbr = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();
    const [tournamentName, setTournamentName] = useState(tournament_abbr);

    const [formData, setFormData] = useState<TournamentRoundInfo[]>([]);
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState<DraftAction | null>(null);
    const [errMsg, setErrMsg] = useState('');
    const [canPublish, setCanPublish] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const createInitialFormData = useCallback((): TournamentRoundInfo => ({
        tournament_name: tournamentName,
        stage_name: '',
        start_time: undefined,
        end_time: undefined,
        is_lobby: false
    }), [tournamentName]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const managedTournament = await resolveManagedTournament(currentUser.currentUser.uid, tournament_abbr);
                    const managedTournamentName = managedTournament?.abbreviation ?? tournament_abbr;
                    setTournamentName(managedTournamentName);
                    setCanPublish(canPublishManagedTournament(managedTournament, currentUser.currentUser.uid));
                    setIsApproved(managedTournament?.status === "approved");
                    const [roundDraft, metaDraft] = await Promise.all([
                        getDraftSection<TournamentRoundInfo[]>(managedTournamentName, "rounds"),
                        getDraftSection<TournamentInfo>(managedTournamentName, "meta"),
                    ]);
                    const data = roundDraft.data;
                    setFormData(data.length > 0 ? data : [{
                        tournament_name: managedTournamentName,
                        stage_name: '',
                        start_time: undefined,
                        end_time: undefined,
                        is_lobby: false
                    }]);
                    setTournamentInfo(metaDraft.data);
                } catch (e) {
                    setErrMsg("加载失败，请刷新重试");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_abbr]);

    const handleUpdateTournament = async (action: DraftAction) => {
        setErrMsg('');
        if (!formData.every(round => round.stage_name && round.start_time)) {
            setErrMsg('请填写所有轮次的名称和开始时间');
            return;
        }

        const shouldPublish = action === "publish";
        let draftSaved = false;
        setPendingAction(action);
        try {
            await saveDraftSection(tournamentName, "rounds", formData);
            draftSaved = true;
            if (!shouldPublish) {
                alert('轮次草稿已保存，公开页面尚未更新');
                return;
            }

            const result = await publishTournamentDraft(tournamentName, {sections: ["rounds"]});
            alert(result.message);
        } catch (e) {
            const message = e instanceof Error ? e.message : "网络错误";
            setErrMsg(draftSaved ? `轮次草稿已保存，但发布失败：${message}` : `保存失败：${message}`);
        } finally {
            setPendingAction(null);
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
                    <ManagementBackLink tournament={tournament_abbr}/>
                    <span>/</span>
                    <span>{tournament_abbr}</span>
                </div>
                {/* 修复：text-white -> text-foreground */}
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <RoundIcon/>
                    轮次管理
                </h1>
                <p className="text-default-500">配置比赛的各个阶段（如：预选赛、小组赛、淘汰赛），可保存为草稿或直接发布。</p>
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
                className="border border-default-200 bg-background/90 backdrop-blur-md shadow-2xl dark:border-white/10 dark:bg-zinc-900/90">
                <Card.Content className="flex flex-row items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onPress={() => router.back()}>取消</Button>
                        <div className="text-danger font-medium text-sm animate-pulse">
                            {errMsg && <span>⚠️ {errMsg}</span>}
                        </div>
                    </div>
                    <DraftSaveActions
                        pendingAction={pendingAction}
                        canPublish={canPublish}
                        publishLabel={isApproved ? "保存并发布" : "保存并提交审核"}
                        onSave={() => handleUpdateTournament("save")}
                        onPublish={() => handleUpdateTournament("publish")}
                    />
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
                                aria-label="小组赛 (Lobby)"
                                className="py-2"
                                isSelected={Boolean(roundData.is_lobby)}
                                size="sm"
                                onChange={(isSelected) =>
                                    onChange({...roundData, is_lobby: isSelected})
                                }
                            >
                                <Switch.Content>
                                    <Switch.Control>
                                        <Switch.Thumb/>
                                    </Switch.Control>
                                    <span className="text-small text-foreground">小组赛 (Lobby)</span>
                                </Switch.Content>
                            </Switch>
                            {isGroup && (
                                <Switch
                                    aria-label="单人预选赛"
                                    className="py-2"
                                    isSelected={Boolean(roundData.is_solo_qualifier)}
                                    size="sm"
                                    onChange={(isSelected) =>
                                        onChange({...roundData, is_solo_qualifier: isSelected})
                                    }
                                >
                                    <Switch.Content>
                                        <Switch.Control>
                                            <Switch.Thumb/>
                                        </Switch.Control>
                                        <span className="text-small text-foreground">单人预选赛</span>
                                    </Switch.Content>
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
