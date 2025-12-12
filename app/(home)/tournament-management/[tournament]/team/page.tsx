"use client"

import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Button} from "@heroui/button";
import {Input} from "@heroui/input";
import {Avatar} from "@heroui/avatar";
import {Chip} from "@heroui/chip";
import {Autocomplete, AutocompleteItem} from "@heroui/autocomplete";
import {siteConfig} from "@/config/site";
import {Checkbox} from "@heroui/checkbox";
import {Card, CardBody, CardHeader, CardFooter} from "@heroui/card";
import {Spinner} from "@heroui/spinner";
import {useRouter} from "next/navigation";
import {Divider} from "@heroui/divider";

// --- 图标 ---
const TeamIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const PlusIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SaveIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const CrownIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="text-warning"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" /></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

export default function EditTeamPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();

    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({players: []});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const players = tournamentPlayers.players.filter(player => player.player == true);
    const teams = tournamentPlayers.groups || [];

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const data = await getPlayers(tournament_name);
                    setTournamentPlayers(data);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const handleSave = async () => {
            // --- 新增：校验逻辑 ---
            const names = teams.map(t => t.name.trim());

            // 1. 检查空名
            if (names.some(n => n === "")) {
                alert("保存失败：存在空白的队伍名称，请检查。");
                return;
            }

            // 2. 检查重名 (利用 Set 去重比较长度)
            const uniqueNames = new Set(names);
            if (uniqueNames.size !== names.length) {
                // 找出重复的名字提示给用户
                const duplicates = names.filter((item, index) => names.indexOf(item) !== index);
                alert(`保存失败：队伍名称重复 [${duplicates[0]}]`);
                return;
            }
            setIsSaving(true);
            try {
                // 修改这里：在 URL 中拼接 ?tournament_name=...
                // 注意：虽然 teams 数组里也有 tournament_name，但如果数组为空就取不到了，
                // 所以直接使用页面 props 中获取到的 tournament_name 变量
                const res = await fetch(
                    siteConfig.backend_url +
                    `/api/update-teams?tournament_name=${encodeURIComponent(tournament_name)}`,
                    {
                        method: 'POST',
                        body: JSON.stringify(teams),
                        headers: {'Content-Type': 'application/json'},
                        credentials: 'include'
                    }
                );

                if (res.status != 200) {
                    alert(await res.text());
                } else {
                    alert('更新成功');
                }
            } finally {
                setIsSaving(false);
            }
        };

    // 辅助函数：更新状态
    const updateTeams = (newTeams: any[]) => {
        setTournamentPlayers(prev => ({...prev, groups: newTeams}));
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
                    <TeamIcon />
                    队伍管理
                </h1>
                <p className="text-default-500">创建并管理参赛队伍，分配队长与队员。</p>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {teams.map((team, index) => (
                    <TeamEditCard
                        key={index}
                        index={index}
                        team={team}
                        players={players}
                        teams={teams}
                        onUpdate={(newTeam: any) => {
                            const newTeams = [...teams];
                            newTeams[index] = newTeam;
                            updateTeams(newTeams);
                        }}
                        onDelete={() => {
                            const newTeams = [...teams];
                            newTeams.splice(index, 1);
                            updateTeams(newTeams);
                        }}
                    />
                ))}

                {/* Add Button */}
                <button
                    onClick={() => {
                        const newTeam = {
                            tournament_name: tournament_name,
                            name: '',
                            icon_url: '',
                            captains: [],
                            members: [],
                            is_verified: false
                        };
                        updateTeams([...teams, newTeam]);
                    }}
                    className="h-full min-h-[300px] border-2 border-dashed border-default-300 rounded-2xl flex flex-col items-center justify-center gap-4 text-default-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                >
                    <div className="p-4 rounded-full bg-default-100 group-hover:bg-primary/10 transition-colors">
                        <PlusIcon />
                    </div>
                    <span className="font-bold text-lg">添加新队伍</span>
                </button>
            </div>

            {/* Sticky Footer */}
            <Card className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">
                    <Button variant="light" onPress={() => router.back()}>取消</Button>
                    <Button
                        color="primary"
                        size="lg"
                        variant="shadow"
                        className="font-bold px-8 shadow-primary/20"
                        startContent={!isSaving && <SaveIcon />}
                        isLoading={isSaving}
                        onPress={handleSave}
                    >
                        {isSaving ? "正在保存..." : "保存队伍信息"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

// --- 子组件：队伍编辑卡片 ---
const TeamEditCard = ({ index, team, players, teams, onUpdate, onDelete }: any) => {

    // 添加成员逻辑
    const addMember = (uid: number) => {
        // 检查是否已存在
        if (team.captains.includes(uid) || team.members.includes(uid)) {
            alert('该成员已在队伍中');
            return;
        }
        onUpdate({ ...team, members: [...team.members, uid] });
    };

    // 移动成员 (队长 <-> 队员)
    const toggleRole = (uid: number, isCaptain: boolean) => {
        if (isCaptain) {
            // 队长 -> 队员
            const newCaptains = team.captains.filter((id: number) => id !== uid);
            const newMembers = [...team.members, uid];
            onUpdate({ ...team, captains: newCaptains, members: newMembers });
        } else {
            // 队员 -> 队长
            const newMembers = team.members.filter((id: number) => id !== uid);
            const newCaptains = [...team.captains, uid];
            onUpdate({ ...team, captains: newCaptains, members: newMembers });
        }
    };

    // 移除成员
    const removeMember = (uid: number, isCaptain: boolean) => {
        if (isCaptain) {
            onUpdate({ ...team, captains: team.captains.filter((id: number) => id !== uid) });
        } else {
            onUpdate({ ...team, members: team.members.filter((id: number) => id !== uid) });
        }
    };

    const isDuplicate = teams.some((t: any, i: number) =>
        i !== index && // 不是自己
        t.name.trim() !== "" && // 不为空
        t.name.trim() === team.name.trim() // 名字相同
    );
    const isEmpty = team.name.trim() === "";
    const isInvalid = isDuplicate || isEmpty;
    const errorMessage = isEmpty ? "名称不能为空" : (isDuplicate ? "队伍名称已存在" : "");

    return (
        <Card className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 shadow-sm overflow-visible">
            <CardHeader className="flex justify-between items-start gap-4 p-4 pb-0">
                <div className="flex gap-4 w-full">
                    {/* 图标部分保持不变 */}
                    <div className="flex flex-col gap-2 items-center">
                        <Avatar
                            src={team.icon_url}
                            name={team.name.charAt(0)}
                            className="w-20 h-20 text-large border-2 border-default-200"
                            isBordered
                        />
                    </div>

                    {/* 基础信息输入 */}
                    <div className="flex flex-col gap-3 flex-grow">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-bold text-foreground">Team {index + 1}</h3>
                            <div className="flex gap-2">
                                <Checkbox
                                    size="sm"
                                    isSelected={team.is_verified}
                                    onValueChange={v => onUpdate({...team, is_verified: v})}
                                >
                                    <span className="text-xs">已审核</span>
                                </Checkbox>
                                <Button isIconOnly size="sm" color="danger" variant="light" onPress={onDelete}><TrashIcon /></Button>
                            </div>
                        </div>

                        {/* 修改点：Input 增加校验状态 */}
                        <Input
                            label="队伍名称"
                            size="sm"
                            variant="bordered"
                            value={team.name}
                            isInvalid={isInvalid}
                            errorMessage={isInvalid && errorMessage}
                            color={isInvalid ? "danger" : "default"}
                            onChange={e => onUpdate({...team, name: e.target.value})}
                        />

                        <Input
                            label="图标链接 (URL)"
                            size="sm"
                            variant="bordered"
                            value={team.icon_url}
                            onChange={e => onUpdate({...team, icon_url: e.target.value})}
                        />
                    </div>
                </div>
            </CardHeader>

            <Divider className="my-4" />

            <CardBody className="px-4 pb-4 pt-0 gap-6">

                {/* 添加成员 */}
                <div>
                    <span className="text-xs font-bold text-default-500 mb-2 block">添加成员 (从已报名选手列表)</span>
                    <Autocomplete
                        placeholder="搜索并选择选手..."
                        defaultItems={players}
                        size="sm"
                        variant="flat"
                        className="max-w-full"
                        onSelectionChange={(key) => key && addMember(Number(key))}
                    >
                        {(player: any) => (
                            <AutocompleteItem key={player.uid} textValue={player.name}>
                                <div className="flex gap-2 items-center">
                                    <Avatar src={`https://a.ppy.sh/${player.uid}`} size="sm" />
                                    <div className="flex flex-col">
                                        <span>{player.name}</span>
                                        <span className="text-tiny text-default-400">#{player.rank}</span>
                                    </div>
                                </div>
                            </AutocompleteItem>
                        )}
                    </Autocomplete>
                </div>

                {/* 成员列表 */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <CrownIcon />
                        <span className="text-xs font-bold text-warning uppercase">Captains (点击降级)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-warning/5 rounded-lg border border-warning/10">
                        {team.captains.map((uid: number) => {
                            const player = players.find((p: any) => p.uid == uid);
                            return (
                                <MemberChip
                                    key={uid}
                                    player={player}
                                    uid={uid}
                                    isCaptain={true}
                                    onToggle={() => toggleRole(uid, true)}
                                    onDelete={() => removeMember(uid, true)}
                                />
                            )
                        })}
                        {team.captains.length === 0 && <span className="text-xs text-default-400 self-center pl-2">暂无队长</span>}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-default-500 uppercase">Members (点击晋升)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-default-100 dark:bg-zinc-800/50 rounded-lg border border-default-200 dark:border-white/5">
                        {team.members.map((uid: number) => {
                            const player = players.find((p: any) => p.uid == uid);
                            return (
                                <MemberChip
                                    key={uid}
                                    player={player}
                                    uid={uid}
                                    isCaptain={false}
                                    onToggle={() => toggleRole(uid, false)}
                                    onDelete={() => removeMember(uid, false)}
                                />
                            )
                        })}
                        {team.members.length === 0 && <span className="text-xs text-default-400 self-center pl-2">暂无队员</span>}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

// --- 子组件：成员 Chip ---
const MemberChip = ({ player, uid, isCaptain, onToggle, onDelete }: any) => {
    return (
        <Chip
            variant={isCaptain ? "shadow" : "flat"}
            color={isCaptain ? "warning" : "default"}
            onClose={onDelete}
            onClick={onToggle}
            className="cursor-pointer hover:scale-105 transition-transform"
            classNames={{
                base: isCaptain ? "bg-warning text-warning-foreground" : "",
            }}
            avatar={
                <Avatar
                    src={`https://a.ppy.sh/${uid}`}
                    className="w-5 h-5"
                />
            }
        >
            {player?.name || `UID: ${uid}`}
        </Chip>
    )
}

// API
async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: revalidate_time}})
    return await res.json()
}