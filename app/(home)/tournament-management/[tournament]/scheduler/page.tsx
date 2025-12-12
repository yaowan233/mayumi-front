"use client";

import React, {useContext, useEffect, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {Button} from "@heroui/button";
import {Input} from "@heroui/input";
import {Autocomplete, AutocompleteItem} from "@heroui/autocomplete";
import {Avatar} from "@heroui/avatar";
import {Divider} from "@heroui/divider";
import {useFilter} from "@react-aria/i18n";
import {Switch} from "@heroui/switch";
import {Chip} from "@heroui/chip";
import {Spinner} from "@heroui/spinner";
import {siteConfig} from "@/config/site";
import {Player, Team, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Tab, Tabs} from "@heroui/tabs";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {Accordion, AccordionItem} from "@heroui/accordion";

// --- 图标 ---
const SaveIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const PlusIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const ScheduleIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);

export default function SchedulerPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);

    // State
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<Schedule[]>([]);
    const [tournamentPlayers, setMembers] = useState<TournamentPlayers>({players: []});
    const [selectedRound, setSelectedRound] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const members = tournamentPlayers.players || [];
    const teams = tournamentPlayers.groups?.filter(group => group.is_verified) || [];
    const allEntities = [...teams, ...members]; // 合并队伍和个人，方便选择

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const [rounds, schedules, players] = await Promise.all([
                        getRoundInfo(tournament_name),
                        getSchedule(tournament_name),
                        getPlayers(tournament_name)
                    ]);
                    setRoundInfo(rounds);
                    setScheduleInfo(schedules);
                    setMembers(players);
                    if (rounds.length > 0) setSelectedRound(rounds[0].stage_name);
                } catch (e) {
                    setErrMsg("加载数据失败");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const handleSave = async () => {
        setErrMsg('');
        // 简单校验
        const currentSchedules = scheduleInfo.filter(s => s.stage_name === selectedRound);
        const isValid = currentSchedules.every(s =>
            s.is_lobby ? (s.name && s.match_time) : (s.team1 && s.team2 && s.match_time && s.match_id)
        );

        if (!isValid) {
            setErrMsg('请填写当前轮次所有必填字段 (*)');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-schedule', {
                'method': 'POST',
                'body': JSON.stringify(scheduleInfo),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            });
            if (res.status != 200) {
                setErrMsg(await res.text());
            } else {
                alert('保存成功');
            }
        } catch (e) {
            setErrMsg("保存失败，网络错误");
        } finally {
            setIsSaving(false);
        }
    };

    // 辅助函数：更新日程列表
    const updateSchedule = (index: number, newSchedule: Schedule) => {
        const newInfo = [...scheduleInfo];
        // 由于过滤显示，需要找到原数组中的正确索引
        // 这里简化处理，假设传入的是原数组索引或者重新映射
        // 最佳实践是给 Schedule 加个唯一 ID，这里先用 index 凑合，但在 Tab 切换下会有问题
        // **修正**：我们在渲染时直接映射原数组的 index
        newInfo[index] = newSchedule;
        setScheduleInfo(newInfo);
    };

    const removeSchedule = (index: number) => {
        const newInfo = [...scheduleInfo];
        newInfo.splice(index, 1);
        setScheduleInfo(newInfo);
    };

    const addSchedule = () => {
        if (!selectedRound) return;
        const currentRoundInfo = roundInfo.find(r => r.stage_name === selectedRound);
        const newSchedule: Schedule = {
            tournament_name: tournament_name,
            stage_name: selectedRound,
            match_id: "",
            match_url: [""],
            is_lobby: currentRoundInfo?.is_lobby || false,
            is_winner_bracket: true,
            team1: "",
            team2: "",
            participants: [],
            referee: [],
            streamer: [],
            commentators: [],
            match_time: new Date().toISOString(),
            name: currentRoundInfo?.is_lobby ? `Lobby ${scheduleInfo.filter(s => s.stage_name === selectedRound).length + 1}` : ""
        };
        setScheduleInfo([...scheduleInfo, newSchedule]);
    };

    if (isLoading) return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg" color="primary" /></div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in pb-32">

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <ScheduleIcon />
                    赛程管理
                </h1>
                <p className="text-default-500">安排对阵表、时间及相关人员配置。</p>
            </div>

            {/* Round Tabs */}
            <div className="flex flex-col gap-6">
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

                {/* Schedule List (Accordion Style) */}
                <div className="flex flex-col gap-4">
                    {scheduleInfo.map((schedule, index) => {
                        if (schedule.stage_name !== selectedRound) return null;

                        return (
                            <ScheduleCard
                                key={index}
                                index={index}
                                schedule={schedule}
                                members={members}
                                teams={teams}
                                allEntities={allEntities}
                                onChange={(newData: Schedule) => updateSchedule(index, newData)}
                                onDelete={() => removeSchedule(index)}
                            />
                        );
                    })}

                    {/* Add Button */}
                    <button
                        onClick={addSchedule}
                        className="w-full h-16 border-2 border-dashed border-default-300 rounded-2xl flex items-center justify-center gap-2 text-default-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                    >
                        <PlusIcon />
                        <span className="font-bold group-hover:tracking-wider transition-all">添加新赛程</span>
                    </button>
                </div>
            </div>

            {/* Sticky Footer */}
            <Card className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">
                    <div className="text-danger font-medium text-sm animate-pulse">
                        {errMsg && <span>⚠️ {errMsg}</span>}
                    </div>
                    <Button
                        color="primary"
                        size="lg"
                        variant="shadow"
                        className="font-bold px-8 shadow-primary/20"
                        startContent={!isSaving && <SaveIcon />}
                        isLoading={isSaving}
                        onPress={handleSave}
                    >
                        {isSaving ? "正在保存..." : "保存赛程"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

// --- 子组件：赛程卡片 (折叠面板) ---
const ScheduleCard = ({ index, schedule, members, teams, allEntities, onChange, onDelete }: any) => {
    // 标题生成
    const title = schedule.is_lobby
        ? (schedule.name || "未命名 Lobby")
        : `${schedule.team1 || "TBD"} vs ${schedule.team2 || "TBD"}`;

    const subtitle = schedule.match_time
        ? new Date(schedule.match_time).toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})
        : "时间未定";

    return (
        <Card className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 shadow-sm transition-all hover:border-primary/50">
            <Accordion isCompact variant="splitted" className="px-0">
                <AccordionItem
                    key="1"
                    aria-label={title}
                    title={
                        <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-foreground text-lg">{title}</span>
                                <span className="text-xs text-default-400 font-mono mt-1 flex gap-2">
                                    <Chip size="sm" variant="flat" color="primary">{schedule.match_id || "ID?"}</Chip>
                                    <span className="self-center">{subtitle}</span>
                                </span>
                            </div>
                            {/* 如果是双败赛制，显示胜/败组标记 */}
                            {!schedule.is_lobby && (
                                <Chip size="sm" color={schedule.is_winner_bracket ? "success" : "danger"} variant="dot" className="border-none">
                                    {schedule.is_winner_bracket ? "胜者组" : "败者组"}
                                </Chip>
                            )}
                        </div>
                    }
                    className="group"
                >
                    <div className="pt-2 pb-6 px-2 flex flex-col gap-6">
                        <Divider className="opacity-50 mb-2" />

                        {/* 1. 基础信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="比赛 ID" size="sm" isRequired value={schedule.match_id} onChange={e => onChange({...schedule, match_id: e.target.value})} />

                            {schedule.is_lobby ? (
                                <Input label="Lobby 名称" size="sm" isRequired value={schedule.name} onChange={e => onChange({...schedule, name: e.target.value})} />
                            ) : (
                                <div className="flex items-center gap-2 lg:col-span-2">
                                    <Switch size="sm" isSelected={schedule.is_winner_bracket} onChange={e => onChange({...schedule, is_winner_bracket: e.target.checked})}>
                                        胜者组 Match
                                    </Switch>
                                </div>
                            )}

                            <div className="flex gap-2 lg:col-span-2">
                                <Input
                                    type="datetime-local"
                                    label="比赛时间"
                                    size="sm"
                                    isRequired
                                    value={schedule.match_time ? new Date(schedule.match_time).toISOString().slice(0, 16) : ""}
                                    onChange={e => {
                                        const date = new Date(e.target.value);
                                        onChange({...schedule, match_time: date.toISOString()});
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. 对阵与人员 (核心逻辑) */}
                        {!schedule.is_lobby ? (
                            // VS 模式
                            <div className="p-4 bg-default-100 dark:bg-zinc-800/50 rounded-xl border border-default-200 dark:border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    {/* Team 1 */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-default-500 uppercase">Team 1 (Blue)</span>
                                        <TeamSelect
                                            label="选择队伍/选手"
                                            items={allEntities}
                                            selectedKey={schedule.team1}
                                            onSelectionChange={(key: string) => onChange({...schedule, team1: key as string})}
                                        />
                                        <Input
                                            type="number"
                                            label="分数"
                                            size="sm"
                                            placeholder="0"
                                            value={schedule.team1_score?.toString()}
                                            onChange={e => onChange({...schedule, team1_score: parseInt(e.target.value) || 0})}
                                        />
                                    </div>

                                    {/* Team 2 */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-default-500 uppercase">Team 2 (Red)</span>
                                        <TeamSelect
                                            label="选择队伍/选手"
                                            items={allEntities}
                                            selectedKey={schedule.team2}
                                            onSelectionChange={(key: string) => onChange({...schedule, team2: key as string})}
                                        />
                                        <Input
                                            type="number"
                                            label="分数"
                                            size="sm"
                                            placeholder="0"
                                            value={schedule.team2_score?.toString()}
                                            onChange={e => onChange({...schedule, team2_score: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Lobby 模式
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-default-500 uppercase">选手名单</span>
                                <MultiSelect
                                    items={allEntities}
                                    selectedKeys={schedule.participants || []}
                                    onSelectionChange={(keys: any) => onChange({...schedule, participants: keys})}
                                    placeholder="添加选手..."
                                />
                            </div>
                        )}

                        {/* 3. Staff 配置 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-default-500">裁判 (Referees)</span>
                                <MultiSelect
                                    items={members.filter((m: { referee: any; }) => m.referee)}
                                    selectedKeys={schedule.referee || []}
                                    onSelectionChange={(keys: any) => onChange({...schedule, referee: keys})}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-default-500">解说 (Commentators)</span>
                                <MultiSelect
                                    items={members.filter((m: { commentator: any; }) => m.commentator)}
                                    selectedKeys={schedule.commentators || []}
                                    onSelectionChange={(keys: any) => onChange({...schedule, commentators: keys})}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-default-500">直播 (Streamers)</span>
                                <MultiSelect
                                    items={members.filter((m: { streamer: any; }) => m.streamer)}
                                    selectedKeys={schedule.streamer || []}
                                    onSelectionChange={(keys: any) => onChange({...schedule, streamer: keys})}
                                />
                            </div>
                        </div>

                        {/* 4. 链接管理 */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-default-500">Match Links (MP Link)</span>
                            {(schedule.match_url || [""]).map((url: string, i: number) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        size="sm"
                                        value={url}
                                        placeholder="https://osu.ppy.sh/community/matches/..."
                                        onChange={e => {
                                            const newUrls = [...(schedule.match_url || [""])];
                                            newUrls[i] = e.target.value;
                                            onChange({...schedule, match_url: newUrls});
                                        }}
                                    />
                                    {i === (schedule.match_url?.length || 1) - 1 ? (
                                        <Button isIconOnly size="sm" onPress={() => onChange({...schedule, match_url: [...(schedule.match_url || []), ""]})}>+</Button>
                                    ) : (
                                        <Button isIconOnly size="sm" color="danger" onPress={() => onChange({...schedule, match_url: schedule.match_url.filter((_: any, idx: number) => idx !== i)})}>-</Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button color="danger" variant="flat" onPress={onDelete} startContent={<TrashIcon />}>
                                删除此赛程
                            </Button>
                        </div>
                    </div>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}

// --- 通用组件：单选队伍 ---
const TeamSelect = ({ items, selectedKey, onSelectionChange, label }: any) => {
    return (
        <Autocomplete
            label={label}
            size="sm"
            defaultSelectedKey={selectedKey}
            onSelectionChange={onSelectionChange}
            variant="bordered"
        >
            {items.map((item: any) => (
                <AutocompleteItem key={item.name} textValue={item.name}>
                    <div className="flex gap-2 items-center">
                        <Avatar src={item.icon_url || `https://a.ppy.sh/${item.uid}`} size="sm" />
                        <span>{item.name}</span>
                    </div>
                </AutocompleteItem>
            ))}
        </Autocomplete>
    )
}

// --- 通用组件：多选 Staff/Player ---
// 这是一个简化的多选实现，实际上 HeroUI 的 Autocomplete 暂不支持多选，这里用 Input + Chip 模拟，或者你可以用 Select multiple
const MultiSelect = ({ items, selectedKeys, onSelectionChange, placeholder = "添加..." }: any) => {
    const [inputVal, setInputVal] = useState("");

    // 过滤逻辑
    let { contains } = useFilter({ sensitivity: 'base' });
    const filteredItems = items.filter((item: any) => contains(item.name, inputVal));

    // 处理选中事件
    const handleSelectionChange = (key: React.Key | null) => {
        if (!key) return;

        const keyString = key.toString();

        // 如果未包含，则添加
        if (!selectedKeys.includes(keyString)) {
            onSelectionChange([...selectedKeys, keyString]);
        }

        // 关键：选中后立刻清空输入框
        // 使用 setTimeout 确保在组件内部状态更新后执行
        requestAnimationFrame(() => {
            setInputVal("");
        });
    };

    return (
        <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-default-200 dark:border-white/10 min-h-[40px] bg-default-100 dark:bg-zinc-800/50">
            {selectedKeys.map((key: string) => (
                <Chip key={key} onClose={() => onSelectionChange(selectedKeys.filter((k: string) => k !== key))} variant="flat" size="sm">
                    {key}
                </Chip>
            ))}

            <Autocomplete
                aria-label="Add"
                placeholder={placeholder}
                className="w-32 flex-grow"

                // 1. 绑定输入值状态
                inputValue={inputVal}
                onInputChange={setInputVal}

                // 2. 关键：强制 selectedKey 为 null
                // 这告诉组件：你只管搜索，不要由你来“记住”选中了谁，选中状态由上面的 Chips 展示
                selectedKey={null}
                onSelectionChange={handleSelectionChange}

                size="sm"
                classNames={{
                    base: "min-w-[100px]",
                }}
                inputProps={{
                    classNames: {
                        inputWrapper: "bg-transparent shadow-none border-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent px-0 min-h-unit-6 h-auto",
                        input: "text-small",
                    }
                }}
                listboxProps={{
                    hideSelectedIcon: true, // 隐藏列表里的对勾，因为我们要清空状态
                }}
            >
                {filteredItems.map((item: any) => (
                    <AutocompleteItem key={item.name} textValue={item.name}>
                        {item.name}
                    </AutocompleteItem>
                ))}
            </Autocomplete>
        </div>
    )
}

async function getSchedule(tournament_name: string): Promise<Schedule[]> {
    const res = await fetch(siteConfig.backend_url + `/api/get-schedule?tournament_name=${tournament_name}`);
    if (!res.ok) {
        throw new Error(res.statusText);
    }
    return await res.json();
}


interface Schedule {
    tournament_name: string;
    stage_name: string;
    match_id: string;
    is_lobby: boolean;
    is_winner_bracket: boolean;
    name?: string;
    match_time: string;
    match_url: string[];
    referee?: string[];
    streamer?: string[];
    commentators?: string[];
    participants?: string[];
    team1: string;
    team2: string;
    team1_score?: number;
    team2_score?: number;
    team1_warmup?: number;
    team2_warmup?: number;
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: revalidate_time}})
    return await res.json()
}
