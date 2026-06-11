"use client";

import React, {type Key, useContext, useEffect, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {
    Accordion,
    Autocomplete,
    Avatar,
    Button,
    Card,
    Chip,
    Description,
    EmptyState,
    Input,
    Label,
    ListBox,
    SearchField,
    Separator,
    Spinner,
    Switch,
    Tabs,
    TextField,
    useFilter,
} from "@heroui/react";
import {siteConfig} from "@/config/site";
import {TournamentPlayers, Player, Team} from "@/app/tournaments/[tournament]/participants/page";
import {TournamentInfo} from "@/components/homepage";

// --- 图标 ---
const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>);
const PlusIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>);
const TrashIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>);
const ScheduleIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>);

export default function SchedulerPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);

    // State
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<Schedule[]>([]);
    const [tournamentPlayers, setMembers] = useState<TournamentPlayers>({players: []});
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);

    const [selectedRound, setSelectedRound] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const [rounds, schedules, players, info] = await Promise.all([
                        getRoundInfo(tournament_name),
                        getSchedule(tournament_name),
                        getPlayers(tournament_name),
                        getTournamentInfo(tournament_name) // 新增获取比赛信息
                    ]);
                    setRoundInfo(rounds);
                    setScheduleInfo(schedules);
                    setMembers(players);
                    setTournamentInfo(info);
                    if (rounds.length > 0) setSelectedRound(rounds[rounds.length - 1].stage_name);
                } catch (e) {
                    setErrMsg("加载数据失败");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    // 核心逻辑修改：根据比赛类型决定下拉框显示谁
    // 1. 获取所有 Staff (裁判/解说等) - 这部分始终是人
    const staffMembers = tournamentPlayers.players || [];

    // 2. 获取参赛单位 (队伍 或 个人)
    // 当前轮次是否为单人预选赛（团队赛中的特殊轮次）
    const currentRoundInfo = roundInfo.find(r => r.stage_name === selectedRound);
    const isSoloRound = currentRoundInfo?.is_solo_qualifier ?? false;
    const participantsSource = (tournamentInfo?.is_group && !isSoloRound)
        ? (tournamentPlayers.groups?.filter(group => group.is_verified) || []) // 团队赛：只显示已审核队伍
        : (tournamentPlayers.players?.filter(p => p.player) || []); // 个人赛 / 单人预选赛：显示选手

    const handleSave = async () => {
        setErrMsg('');
        const currentSchedules = scheduleInfo.filter(s => s.stage_name === selectedRound);
        const isValid = currentSchedules.every(s =>
            s.is_lobby ? (s.name && s.match_time) : (s.team1 && s.team2 && s.match_time)
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

    const updateSchedule = (index: number, newSchedule: Schedule) => {
        const newInfo = [...scheduleInfo];
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
            match_id: crypto.randomUUID(),
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

    if (isLoading) return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg"/>
    </div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <ScheduleIcon/>
                    赛程管理
                </h1>
                <p className="text-default-500">
                    {tournamentInfo?.is_group
                        ? isSoloRound ? "当前轮次：单人预选赛（团队赛）" : "当前为团队赛模式"
                        : "当前为个人赛模式"
                    } - 安排对阵表、时间及相关人员配置。
                </p>
            </div>

            {/* Content ... */}
            <div className="flex flex-col gap-6">
                <Tabs selectedKey={selectedRound ?? undefined} onSelectionChange={(key) => setSelectedRound(key as string)}>
                    <Tabs.ListContainer className="w-fit max-w-full">
                        <Tabs.List aria-label="Rounds" className="w-fit max-w-full">
                            {roundInfo.map((item) => (
                                <Tabs.Tab key={item.stage_name} id={item.stage_name} className="whitespace-nowrap">
                                    <span>{item.stage_name}</span>
                                    <Tabs.Indicator/>
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>

                    {roundInfo.map((item) => {
                        const schedulesForRound = scheduleInfo
                            .map((schedule, index) => ({schedule, originalIndex: index}))
                            .filter(({schedule}) => schedule.stage_name === item.stage_name);

                        return (
                            <Tabs.Panel key={item.stage_name} id={item.stage_name} className="pt-6">
                                <div className="flex flex-col gap-4">
                                    {schedulesForRound.map(({schedule, originalIndex}) => (
                                        <ScheduleCard
                                            key={schedule.match_id}
                                            index={originalIndex}
                                            schedule={schedule}
                                            staffMembers={staffMembers}
                                            participants={participantsSource}
                                            onChange={(newData: Schedule) => updateSchedule(originalIndex, newData)}
                                            onDelete={() => removeSchedule(originalIndex)}
                                            isTeamMode={tournamentInfo?.is_group && !isSoloRound}
                                        />
                                    ))}
                                    <Button variant="secondary" size="sm" className="h-10 border-2 border-dashed" onPress={addSchedule}>
                                        <span className="flex items-center gap-2 text-sm">
                                            <PlusIcon/>
                                            <span>添加新赛程</span>
                                        </span>
                                    </Button>
                                </div>
                            </Tabs.Panel>
                        );
                    })}
                </Tabs>
            </div>

            {/* Footer ... */}
            <Card
                variant="secondary"
                className="sticky bottom-6 z-50 border border-default-200 bg-background/90 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90">
                <Card.Content className="flex flex-row items-center justify-between px-6 py-4">
                    <div className="text-danger font-medium text-sm animate-pulse">{errMsg &&
                        <span>⚠️ {errMsg}</span>}</div>
                    <Button size="lg" variant="primary" className="px-8 font-bold shadow-primary/20" isPending={isSaving}
                            onPress={handleSave}>
                        {!isSaving && <SaveIcon/>}
                        <span>{isSaving ? "正在保存..." : "保存赛程"}</span>
                    </Button>
                </Card.Content>
            </Card>
        </div>
    );
}

// --- 子组件：赛程卡片 ---
// 接收 participants (参赛单位) 和 staffMembers (工作人员) 分开处理
const ScheduleCard = ({index, schedule, staffMembers, participants, onChange, onDelete, isTeamMode}: {
    index: number;
    schedule: Schedule;
    staffMembers: Player[];
    participants: Player[] | Team[];
    onChange: (schedule: Schedule) => void;
    onDelete: () => void;
    isTeamMode?: boolean;
}) => {
    const title = schedule.is_lobby
        ? (schedule.name || "未命名 Lobby")
        : `${schedule.team1 || "TBD"} vs ${schedule.team2 || "TBD"}`;
    const subtitle = schedule.match_time ? new Date(schedule.match_time).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : "时间未定";

    return (
        <Card
            className="overflow-hidden p-1 shadow-sm transition-colors">
            <Accordion className="px-0">
                <Accordion.Item id="details" className="group">
                    <Accordion.Heading>
                        <Accordion.Trigger className="px-6 py-5 text-left">
                            <div className="flex w-full items-center justify-between gap-4 pr-2">
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-foreground">{title}</span>
                                    <span className="mt-1 font-mono text-xs text-default-400">{subtitle}</span>
                                </div>
                                {!schedule.is_lobby && (
                                    <Chip size="sm" color={schedule.is_winner_bracket ? "success" : "danger"} variant="soft"
                                          className="border-none">
                                        {schedule.is_winner_bracket ? "胜者组" : "败者组"}
                                    </Chip>
                                )}
                            </div>
                            <Accordion.Indicator/>
                        </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                        <Accordion.Body className="px-6 pb-6 pt-2">
                            <div className="flex flex-col gap-6">
                                <Separator className="opacity-50"/>

                        {/* 1. 基础信息 */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {schedule.is_lobby ? (
                                <TextField isRequired>
                                    <Label>Lobby 名称</Label>
                                    <Input variant="secondary" value={schedule.name ?? ""}
                                           onChange={e => onChange({...schedule, name: e.target.value})}/>
                                </TextField>
                            ) : (
                                <div className="flex items-center gap-2 lg:col-span-2">
                                    <Switch size="sm" isSelected={schedule.is_winner_bracket} onChange={(isSelected) => onChange({
                                        ...schedule,
                                        is_winner_bracket: isSelected
                                    })}>
                                        <Switch.Control>
                                            <Switch.Thumb/>
                                        </Switch.Control>
                                        <Switch.Content>
                                            <Label>胜者组 Match</Label>
                                        </Switch.Content>
                                    </Switch>
                                </div>
                            )}
                            <div className="flex gap-2 lg:col-span-2">
                                <TextField isRequired className="w-full">
                                    <Label>比赛时间 (UTC)</Label>
                                    <Input
                                        type="datetime-local"
                                        variant="secondary"
                                        value={(() => {
                                            if (!schedule.match_time) return "";
                                            const date = new Date(schedule.match_time);
                                            if (isNaN(date.getTime())) return "";

                                            const pad = (n: number) => n.toString().padStart(2, '0');
                                            return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
                                        })()}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (!val) return;

                                            const [datePart, timePart] = val.split('T');
                                            const [year, month, day] = datePart.split('-').map(Number);
                                            const [hours, minutes] = timePart.split(':').map(Number);

                                            const utcDate = new Date();
                                            utcDate.setUTCFullYear(year, month - 1, day);
                                            utcDate.setUTCHours(hours, minutes, 0, 0);

                                            onChange({...schedule, match_time: utcDate.toISOString()});
                                        }}
                                    />
                                </TextField>
                            </div>
                        </div>

                        {/* 2. 对阵与人员 */}
                        {!schedule.is_lobby ? (
                            <div
                                className="rounded-xl border border-default-200 bg-default-100 p-4 dark:border-white/5 dark:bg-zinc-800/50">
                                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-default-500">Team 1 (Blue)</span>
                                        <TeamSelect
                                            label={isTeamMode ? "选择队伍" : "选择选手"}
                                            items={participants}
                                            selectedKey={schedule.team1}
                                            onSelectionChange={(key: string) => onChange({
                                                ...schedule,
                                                team1: key as string
                                            })}
                                        />
                                        <TextField>
                                            <Label>分数</Label>
                                            <Input type="number" placeholder="0" variant="secondary"
                                                   value={schedule.team1_score?.toString() ?? ""} onChange={e => onChange({
                                                ...schedule,
                                                team1_score: parseInt(e.target.value) || 0
                                            })}/>
                                        </TextField>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-default-500">Team 2 (Red)</span>
                                        <TeamSelect
                                            label={isTeamMode ? "选择队伍" : "选择选手"}
                                            items={participants}
                                            selectedKey={schedule.team2}
                                            onSelectionChange={(key: string) => onChange({
                                                ...schedule,
                                                team2: key as string
                                            })}
                                        />
                                        <TextField>
                                            <Label>分数</Label>
                                            <Input type="number" placeholder="0" variant="secondary"
                                                   value={schedule.team2_score?.toString() ?? ""} onChange={e => onChange({
                                                ...schedule,
                                                team2_score: parseInt(e.target.value) || 0
                                            })}/>
                                        </TextField>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-foreground">选手名单</span>
                                <MultiSelect
                                    items={participants}
                                    selectedKeys={schedule.participants || []}
                                    onSelectionChange={(keys: string[]) => onChange({...schedule, participants: keys})}
                                    placeholder={isTeamMode ? "添加人员" : "添加人员"}
                                />
                            </div>
                        )}

                        {/* 3. Staff 配置 (使用 staffMembers) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-foreground">裁判</span>
                                <MultiSelect items={staffMembers.filter(m => m.referee)}
                                             selectedKeys={schedule.referee || []}
                                             onSelectionChange={(keys: string[]) => onChange({...schedule, referee: keys})}/>
                            </div>
                            <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-foreground">解说</span>
                                <MultiSelect items={staffMembers.filter(m => m.commentator)}
                                             selectedKeys={schedule.commentators || []}
                                             onSelectionChange={(keys: string[]) => onChange({
                                                 ...schedule,
                                                 commentators: keys
                                             })}/>
                            </div>
                            <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-foreground">直播</span>
                                <MultiSelect items={staffMembers.filter(m => m.streamer)}
                                             selectedKeys={schedule.streamer || []}
                                             onSelectionChange={(keys: string[]) => onChange({
                                                 ...schedule,
                                                 streamer: keys
                                             })}/>
                            </div>
                        </div>

                        {/* 4. 链接管理 ... (保持不变) */}
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-foreground">比赛链接</span>
                            {(schedule.match_url || [""]).map((url: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input className="flex-1" variant="secondary" value={url} placeholder="https://osu.ppy.sh/community/matches/..."
                                           onChange={e => {
                                                const newUrls = [...(schedule.match_url || [""])];
                                                newUrls[i] = e.target.value;
                                                onChange({...schedule, match_url: newUrls});
                                            }}/>
                                    {i === (schedule.match_url?.length || 1) - 1 ? (
                                        <Button isIconOnly className="shrink-0" size="sm" variant="secondary" onPress={() => onChange({
                                            ...schedule,
                                            match_url: [...(schedule.match_url || []), ""]
                                        })}>+</Button>
                                    ) : (
                                        <Button isIconOnly className="shrink-0" size="sm" variant="secondary" onPress={() => onChange({
                                            ...schedule,
                                            match_url: schedule.match_url.filter((_: string, idx: number) => idx !== i)
                                        })}>-</Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onPress={onDelete}  variant="danger">
                                <TrashIcon/>
                                <span>删除此赛程</span>
                            </Button>
                        </div>
                    </div>
                        </Accordion.Body>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Card>
    );
}

// --- 通用组件：单选队伍 ---
const TeamSelect = ({items, selectedKey, onSelectionChange, label}: {
    items: (Player | Team)[];
    selectedKey: string;
    onSelectionChange: (key: string) => void;
    label: string;
}) => {
    const [inputValue, setInputValue] = useState("");
    const {contains} = useFilter({sensitivity: 'base'});
    const filteredItems = items.filter((item) => contains(item.name, inputValue));

    const onInputChange = (value: string) => {
        setInputValue(value);
    };

    const handleSelectionChange = (key: Key | null) => {
        if (!key) {
            return;
        }

        const nextKey = String(key);
        const selectedItem = items.find((item) => item.name === nextKey);
        setInputValue(selectedItem?.name ?? nextKey);
        onSelectionChange(nextKey);
    };

    return (
        <Autocomplete
            aria-label={label}
            className="w-full"
            variant="secondary"
            value={selectedKey || null}
            onChange={handleSelectionChange}
            onClear={() => {
                setInputValue("");
                onSelectionChange("");
            }}
            selectionMode="single"
        >
            <Label>{label}</Label>
            <Autocomplete.Trigger>
                <Autocomplete.Value>
                    {({defaultChildren, isPlaceholder, state}) => {
                        if (isPlaceholder || state.selectedItems.length === 0) {
                            return defaultChildren;
                        }

                        const selectedItem = items.find((item) => item.name === state.selectedItems[0]?.key);
                        if (!selectedItem) {
                            return defaultChildren;
                        }

                        return (
                            <div className="flex items-center gap-2">
                                <Avatar className="size-4" size="sm">
                                    <Avatar.Image src={"icon_url" in selectedItem ? (selectedItem.icon_url ?? "https://a.ppy.sh/") : `https://a.ppy.sh/${(selectedItem as Player).uid}`}/>
                                    <Avatar.Fallback>{selectedItem.name?.[0] ?? "?"}</Avatar.Fallback>
                                </Avatar>
                                <span>{selectedItem.name}</span>
                            </div>
                        );
                    }}
                </Autocomplete.Value>
                <Autocomplete.ClearButton/>
                <Autocomplete.Indicator/>
            </Autocomplete.Trigger>
            <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                    <SearchField autoFocus name="team-search" variant="secondary" value={inputValue}
                                 onChange={onInputChange}>
                        <SearchField.Group>
                            <SearchField.SearchIcon/>
                            <SearchField.Input placeholder={`搜索${label}...`}/>
                            <SearchField.ClearButton/>
                        </SearchField.Group>
                    </SearchField>
                    <ListBox renderEmptyState={() => <EmptyState>没有匹配项</EmptyState>}>
                        {filteredItems.map((item) => (
                            <ListBox.Item key={item.name} id={item.name} textValue={item.name}>
                                <Avatar size="sm">
                                    <Avatar.Image src={"icon_url" in item ? (item.icon_url ?? "https://a.ppy.sh/") : `https://a.ppy.sh/${(item as Player).uid}`}/>
                                    <Avatar.Fallback>{item.name?.[0] ?? "?"}</Avatar.Fallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <Label>{item.name}</Label>
                                    <Description>{"uid" in item ? `#${item.uid}` : "队伍"}</Description>
                                </div>
                                <ListBox.ItemIndicator/>
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Autocomplete.Filter>
            </Autocomplete.Popover>
        </Autocomplete>
    )
}

// --- 通用组件：多选 Staff/Player ---
// 这是一个简化的多选实现，实际上 HeroUI 的 Autocomplete 暂不支持多选，这里用 Input + Chip 模拟，或者你可以用 Select multiple
const MultiSelect = ({items, selectedKeys, onSelectionChange, placeholder = "添加人员"}: {
    items: (Player | Team)[];
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
    placeholder?: string;
}) => {
    const [inputVal, setInputVal] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const {contains} = useFilter({sensitivity: 'base'});
    const filteredItems = items.filter((item) => contains(item.name, inputVal));

    const handleSelectionChange = (key: Key | null) => {
        if (!key) return;

        const keyString = key.toString();

        // 如果未包含，则添加
        if (!selectedKeys.includes(keyString)) {
            onSelectionChange([...selectedKeys, keyString]);
        }

        requestAnimationFrame(() => {
            setInputVal("");
            setIsOpen(true);
        });
    };

    const itemMap = new Map<string, Player | Team>(items.map((item) => [item.name, item]));

    return (
        <div
            className="flex min-h-[40px] flex-wrap items-center gap-2 rounded-lg border border-default-200 bg-default-100 p-2 dark:border-white/10 dark:bg-zinc-800/50">
            {selectedKeys.map((key: string) => {
                const item = itemMap.get(key);
                return (
                    <Chip key={key} color="default" variant="primary" size="sm">
                        <span className="flex items-center gap-2 text-foreground">
                            <Avatar size="sm" className="size-5 shrink-0">
                                <Avatar.Image src={item && "icon_url" in item ? item.icon_url : `https://a.ppy.sh/${(item as Player)?.uid}`}/>
                                <Avatar.Fallback>{key[0] ?? "?"}</Avatar.Fallback>
                            </Avatar>
                            <span className="max-w-40 truncate">{key}</span>
                            <button
                                type="button"
                                className="text-foreground/70 transition-opacity hover:opacity-70"
                                onClick={() => onSelectionChange(selectedKeys.filter((k: string) => k !== key))}
                                aria-label={`移除 ${key}`}
                            >
                                ×
                            </button>
                        </span>
                    </Chip>
                );
            })}

            <Autocomplete
                aria-label="Add"
                className="min-w-[140px] flex-1"
                variant="secondary"
                value={null}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                onChange={handleSelectionChange}
                onClear={() => {
                    setInputVal("");
                    setIsOpen(true);
                }}
                selectionMode="single"
            >
                <Autocomplete.Trigger className="flex min-h-8 w-full items-center justify-between gap-2 border-none bg-transparent px-2 py-1.5 shadow-none data-[hover=true]:bg-transparent data-[focus-visible=true]:ring-0 dark:bg-transparent">
                    <Autocomplete.Value className="flex-1">
                        {() => <span className="flex min-h-5 items-center text-sm text-default-400">{placeholder}</span>}
                    </Autocomplete.Value>
                    <Autocomplete.Indicator className="shrink-0 text-lg text-default-500"/>
                </Autocomplete.Trigger>
                <Autocomplete.Popover>
                    <Autocomplete.Filter filter={contains}>
                        <SearchField autoFocus name="multi-select-search" variant="secondary" value={inputVal}
                                     onChange={setInputVal}>
                            <SearchField.Group>
                                <SearchField.SearchIcon/>
                                <SearchField.Input placeholder={placeholder}/>
                                <SearchField.ClearButton/>
                            </SearchField.Group>
                        </SearchField>
                        <ListBox renderEmptyState={() => <EmptyState>没有匹配项</EmptyState>}>
                            {filteredItems.map((item) => (
                                <ListBox.Item key={item.name} id={item.name} textValue={item.name}>
                                    <Avatar size="sm">
                                        <Avatar.Image src={"icon_url" in item ? (item.icon_url ?? "https://a.ppy.sh/") : `https://a.ppy.sh/${(item as Player).uid}`}/>
                                        <Avatar.Fallback>{item.name?.[0] ?? "?"}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <Label>{item.name}</Label>
                                        <Description>{"uid" in item ? `#${item.uid}` : "队伍"}</Description>
                                    </div>
                                    <ListBox.ItemIndicator/>
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Autocomplete.Filter>
                </Autocomplete.Popover>
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


async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        {next: {revalidate: 0}})
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json()
}
