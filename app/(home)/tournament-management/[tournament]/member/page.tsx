"use client";

import React, {type Key, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {
    Autocomplete,
    Avatar,
    Button,
    Card,
    Description,
    EmptyState,
    Label,
    ListBox,
    Modal,
    SearchField,
    Spinner,
    Table,
    Tabs,
    useFilter,
    useOverlayState,
} from "@heroui/react";
import {RegistrationInfo} from "@/components/homepage";
import {siteConfig} from "@/config/site";
import {Player, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {resolveManagedTournamentName} from "@/lib/tournament_management";

// --- 配置 ---
const ROLES = [
    {key: "host", label: "主办"},
    {key: "player", label: "选手"},
    {key: "referee", label: "裁判"},
    {key: "streamer", label: "直播"},
    {key: "commentator", label: "解说"},
    {key: "mappooler", label: "选图"},
    {key: "custom_mapper", label: "作图"},
    {key: "graphic_designer", label: "设计"},
    {key: "scheduler", label: "时间安排"},
    {key: "map_tester", label: "测图"},
    {key: "donator", label: "赞助"},
] as const;

// --- 图标 ---
const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>);
const UserIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>);

const columns = [
    {name: "UID", key: "uid"},
    {name: "名字", key: "name"},
    {name: "QQ", key: "qqNumber"},
    {name: "首次Staff", key: "isFirstTimeStaff"},
    {name: "经验", key: "tournamentExperience"},
    {name: "意向", key: "selectedPositions"},
    {name: "其他", key: "otherDetails"},
    {name: "备注", key: "additionalComments"},
];

export default function EditMemberPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const currentUser = useContext(CurrentUserContext);
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({players: []});
    const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const modalState = useOverlayState();
    const tournament_abbr = decodeURIComponent(params.tournament);
    const [tournamentName, setTournamentName] = useState(tournament_abbr);
    const players = tournamentPlayers.players || [];
    const teams = tournamentPlayers.groups;
    const playerNameByUid = new Map(players.map((player) => [player.uid, player.name]));

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                setIsLoading(true);
                try {
                    const managedTournamentName = await resolveManagedTournamentName(currentUser.currentUser.uid, tournament_abbr);
                    setTournamentName(managedTournamentName);
                    const [data, regInfo] = await Promise.all([
                        getPlayers(managedTournamentName),
                        getRegistrationInfo(managedTournamentName)
                    ]);
                    setTournamentPlayers(data);
                    setRegistrationInfo(regInfo);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_abbr]);

    const handleRefreshStats = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(
                `${siteConfig.backend_url}/api/refresh-members-stats?tournament_name=${encodeURIComponent(tournamentName)}`,
                {method: 'POST', credentials: 'include'}
            );
            if (res.ok) {
                const data = await res.json();
                alert(`刷新成功：已更新 ${data.updated} / ${data.total} 名选手数据`);
                const updated = await getPlayers(tournamentName);
                setTournamentPlayers(updated);
            } else {
                alert(await res.text());
            }
        } catch (e) {
            alert('刷新失败，请检查网络');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-members', {
                'method': 'POST',
                'body': JSON.stringify(players),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            });
            if (res.status != 200) {
                alert(await res.text());
            } else {
                alert('保存成功');
            }
        } catch (e) {
            alert('保存失败，请检查网络');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">

            {/* Header: 修复文字颜色和边框 */}
            <div
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-default-200 dark:border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <UserIcon/> 成员管理
                    </h1>
                    <p className="text-default-500 mt-1">管理各职位成员权限及查看申请列表</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        isPending={isRefreshing}
                        onPress={handleRefreshStats}
                    >
                        {isRefreshing ? "刷新中..." : "刷新选手数据"}
                    </Button>
                    <Modal state={modalState}>
                        <Modal.Trigger className="relative inline-flex">
                            <Button variant="secondary">
                                查看申请列表
                            </Button>
                            {registrationInfo.length > 0 && (
                                <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-semibold text-white">
                                    {registrationInfo.length}
                                </span>
                            )}
                        </Modal.Trigger>
                        <Modal.Backdrop>
                            <Modal.Container size="cover" scroll="inside">
                                <Modal.Dialog>
                                    {({close}) => (
                                        <>
                                            <Modal.Header>
                                                <Modal.Heading>成员申请列表 ({registrationInfo.length})</Modal.Heading>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <Table variant="secondary">
                                                    <Table.ScrollContainer className="overflow-x-auto">
                                                        <Table.Content aria-label="Applications">
                                                            <Table.Header>
                                                                {columns.map((column) => (
                                                                    <Table.Column key={column.key} isRowHeader={column.key === "uid"} className={getApplicationColumnClass(column.key)}>
                                                                        {column.name}
                                                                    </Table.Column>
                                                                ))}
                                                            </Table.Header>
                                                            <Table.Body renderEmptyState={() => <EmptyState>暂无申请</EmptyState>}>
                                                                {registrationInfo.map((item) => (
                                                                    <Table.Row key={item.uid} id={String(item.uid)}>
                                                                        {columns.map((column) => (
                                                                            <Table.Cell key={column.key}>
                                                                                {renderRegistrationValue(item, column.key, playerNameByUid)}
                                                                            </Table.Cell>
                                                                        ))}
                                                                    </Table.Row>
                                                                ))}
                                                            </Table.Body>
                                                        </Table.Content>
                                                    </Table.ScrollContainer>
                                                </Table>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button variant="ghost" className="text-danger" onPress={close}>关闭</Button>
                                            </Modal.Footer>
                                        </>
                                    )}
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                </div>
            </div>

            {isLoading && (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-default-500">
                    <Spinner />
                    <span>正在加载成员信息...</span>
                </div>
            )}

            {!isLoading && <>
            {/* Main Content: Role Management Tabs */}
            <div className="flex flex-col gap-4">
                <Tabs>
                    <Tabs.ListContainer className="sticky top-4 z-40 max-w-full overflow-x-auto rounded-2xl border border-default-200 bg-background/95 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90">
                        <Tabs.List aria-label="Role Management" className="w-max min-w-full">
                            {ROLES.map((role) => (
                                <Tabs.Tab key={role.key} id={role.key} className="whitespace-nowrap">
                                    {role.label}
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                    {ROLES.map((role) => (
                        <Tabs.Panel key={role.key} id={role.key} className="pt-6">
                            <Card className="border border-default-200 shadow-sm dark:border-white/5">
                                <Card.Content className="p-6 sm:p-8">
                                    <RoleManagementSection
                                        roleKey={role.key as keyof Player}
                                        roleLabel={role.label}
                                        players={players}
                                        teams={teams}
                                        setTournamentPlayers={setTournamentPlayers}
                                        currentUid={currentUser?.currentUser?.uid}
                                        tournamentName={tournamentName}
                                    />
                                </Card.Content>
                            </Card>
                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>

            {/* Sticky Footer: 修复背景色 */}
            <Card
                className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <Card.Content className="flex flex-row items-center justify-between px-6 py-4">
                    <div className="text-default-500 text-sm">
                        * 修改后请务必点击保存
                    </div>
                    <Button
                        size="lg"
                        variant="primary"
                        className="px-8 font-bold"
                        isPending={isSaving}
                        onPress={handleSave}
                    >
                        <span className="flex items-center gap-2">
                            {!isSaving && <SaveIcon/>}
                            <span>{isSaving ? "正在保存..." : "保存所有更改"}</span>
                        </span>
                    </Button>
                </Card.Content>
            </Card>
            </>}
        </div>
    );
}

function renderRegistrationValue(item: RegistrationInfo, columnKey: string, playerNameByUid: Map<number, string>) {
    if (columnKey === "name") {
        return item.uid != null ? playerNameByUid.get(item.uid) ?? "-" : "-";
    }

    const value = item[columnKey as keyof RegistrationInfo];

    if (columnKey === "selectedPositions") {
        return Array.isArray(value) ? value.join("，") : "";
    }

    if (typeof value === "boolean") {
        return value ? "是" : "否";
    }

    return value ?? "-";
}

function getApplicationColumnClass(columnKey: string) {
    switch (columnKey) {
        case "uid":
            return "min-w-20";
        case "qqNumber":
            return "min-w-28";
        case "name":
            return "min-w-32";
        case "isFirstTimeStaff":
            return "min-w-24";
        case "tournamentExperience":
            return "min-w-40";
        case "selectedPositions":
            return "min-w-44";
        case "otherDetails":
        case "additionalComments":
            return "min-w-48";
        default:
            return "min-w-28";
    }
}

// --- 子组件：单个职位管理区块 ---
const RoleManagementSection = ({
                                   roleKey,
                                   roleLabel,
                                   players,
                                   teams,
                                   setTournamentPlayers,
                                   currentUid,
                                   tournamentName
                               }: any) => {

    const removeMember = (index: number) => {
        const member = players[index];
        if (roleKey === 'host' && member.uid === currentUid) {
            alert('无法移除自己的主办权限');
            return;
        }
        const updatedMembers = [...players];
        updatedMembers[index][roleKey] = false;
        setTournamentPlayers({players: updatedMembers, groups: teams});
    };

    const currentMembers = players.map((p: any, i: number) => ({
        ...p,
        originalIndex: i
    })).filter((p: any) => p[roleKey]);

    return (
        <div className="flex flex-col gap-8">
            <div
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-default-100 dark:border-white/5">
                <div>
                    {/* 修复：文字颜色改为 text-foreground (自动黑白) */}
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        {roleLabel}
                                <span className="text-default-400 text-lg font-normal">({currentMembers.length})</span>
                    </h2>
                    <p className="text-default-400 text-sm mt-1">管理拥有此职位的用户，或添加新成员。</p>
                </div>

                <AddMember
                    members={players}
                    teams={teams}
                    setMembers={setTournamentPlayers}
                    tournamentName={tournamentName}
                    position={roleKey}
                />
            </div>

            <div className="flex flex-wrap gap-4 min-h-[100px]">
                {currentMembers.length > 0 ? (
                    currentMembers.map((member: any) => (
                        <div
                            key={member.uid}
                            className="flex h-14 items-center gap-3 rounded-xl border border-default-200 bg-default-50 px-3 py-1.5 transition-colors hover:bg-default-100 dark:border-white/10 dark:bg-black/40 dark:hover:bg-zinc-800"
                        >
                            <Avatar className="h-10 w-10 border-2 border-white/50 dark:border-white/10">
                                <Avatar.Image src={`https://a.ppy.sh/${member.uid}`}/>
                                <Avatar.Fallback>{member.name?.[0] ?? "?"}</Avatar.Fallback>
                            </Avatar>
                            <div className="flex flex-col justify-center">
                                <span className="leading-none">{member.name}</span>
                                <span className="mt-0.5 text-[10px] font-mono leading-tight text-default-400">#{member.uid}</span>
                            </div>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                className="ml-1 text-default-400 hover:text-danger"
                                onPress={() => removeMember(member.originalIndex)}
                            >
                                ×
                            </Button>
                        </div>
                    ))
                ) : (
                    // 修复：空状态边框和颜色
                    <div
                        className="w-full flex flex-col items-center justify-center py-12 text-default-400 border-2 border-dashed border-default-200 dark:border-white/5 rounded-xl bg-default-50 dark:bg-white/5">
                        <span className="text-4xl mb-2 opacity-50">∅</span>
                        <span>暂无 {roleLabel.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 子组件：添加成员 ---
const AddMember = ({members, teams, setMembers, tournamentName, position}: any) => {
    const [fieldState, setFieldState] = useState<{ selectedKey: string | null, inputValue: string }>({
        selectedKey: null,
        inputValue: "",
    });
    let {contains} = useFilter({sensitivity: 'base'});
    const filteredMembers = members.filter((item: Player) => contains(`${item.uid} ${item.name}`, fieldState.inputValue));

    const onInputChange = (value: string) => {
        setFieldState((prev: any) => ({
            inputValue: value,
            selectedKey: value === "" ? null : prev.selectedKey,
        }));
    };

    const onSelectionChange = (key: Key | null) => {
        if (!key) {
            setFieldState((prev) => ({...prev, selectedKey: null}));
            return;
        }

        const nextKey = String(key);
        const selectedMember = members.find((member: Player) => member.uid.toString() === nextKey);
        setFieldState((prev) => ({
            ...prev,
            inputValue: selectedMember ? `${selectedMember.uid}` : nextKey,
            selectedKey: nextKey,
        }));
    };

    const handleAddMember = async () => {
        for (const member of members) {
            if (member.uid.toString() == fieldState.inputValue) {
                if (member[position]) {
                    alert(`该用户已经是${position}`);
                    return;
                }
                const updatedMembers = [...members];
                updatedMembers[members.indexOf(member)][position] = true;
                setMembers({players: updatedMembers, groups: teams});
                setFieldState({selectedKey: null, inputValue: ""});
                return;
            }
        }
        if (!fieldState.inputValue) {
            alert('请输入 UID');
            return;
        }
        try {
            const res = await fetch(`${siteConfig.backend_url}/api/user?uid=${fieldState.inputValue}&tournament_name=${tournamentName}`);
            if (res.status !== 200) alert("用户不存在");
            const data = await res.json();

            const newMember = {
                uid: parseInt(fieldState.inputValue),
                name: data.username,
                tournament_name: tournamentName,
                host: false,
                player: false,
                referee: false,
                streamer: false,
                commentator: false,
                mappooler: false,
                custom_mapper: false,
                graphic_designer: false,
                scheduler: false,
                map_tester: false,
                donator: false,
                [position]: true,
                pp: data.statistics.pp,
                rank: data.statistics.global_rank,
                country: data.country_code,
            };
            setMembers({players: [...members, newMember], groups: teams});
            setFieldState({
                selectedKey: null,
                inputValue: "",
            });
        } catch (e) {
            alert('添加失败：用户不存在或网络错误');
        }
    };

    return (
        <div
            className="flex gap-2 w-full md:w-auto items-center bg-default-100 dark:bg-zinc-900/50 p-1.5 rounded-lg border border-default-200 dark:border-white/5">
            <Autocomplete
                aria-label="成员搜索框"
                className="w-full md:w-72"
                placeholder="输入成员 UID 或用户名"
                variant="secondary"
                value={fieldState.selectedKey}
                onChange={onSelectionChange}
                onClear={() => setFieldState({selectedKey: null, inputValue: ""})}
                selectionMode="single"
            >
                <Label>添加成员</Label>
                <Autocomplete.Trigger>
                    <Autocomplete.Value>
                        {({defaultChildren, isPlaceholder, state}) => {
                            if (isPlaceholder || state.selectedItems.length === 0) {
                                return defaultChildren;
                            }

                            const selectedMember = members.find((member: Player) => member.uid.toString() === state.selectedItems[0]?.key);
                            if (!selectedMember) {
                                return defaultChildren;
                            }

                            return (
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-4" size="sm">
                                        <Avatar.Image src={`https://a.ppy.sh/${selectedMember.uid}`}/>
                                        <Avatar.Fallback>{selectedMember.name?.[0] ?? "?"}</Avatar.Fallback>
                                    </Avatar>
                                    <span>{selectedMember.name}</span>
                                </div>
                            );
                        }}
                    </Autocomplete.Value>
                    <Autocomplete.ClearButton />
                    <Autocomplete.Indicator />
                </Autocomplete.Trigger>
                <Autocomplete.Popover>
                    <Autocomplete.Filter filter={contains}>
                        <SearchField autoFocus name="member-search" variant="secondary" value={fieldState.inputValue} onChange={onInputChange}>
                            <SearchField.Group>
                                <SearchField.SearchIcon />
                                <SearchField.Input placeholder="搜索成员 UID 或用户名..." />
                                <SearchField.ClearButton />
                            </SearchField.Group>
                        </SearchField>
                        <ListBox renderEmptyState={() => <EmptyState>没有匹配成员</EmptyState>}>
                            {filteredMembers.map((member: Player) => (
                                <ListBox.Item key={member.uid} id={member.uid.toString()} textValue={`${member.uid} ${member.name}`}>
                                    <Avatar size="sm">
                                        <Avatar.Image src={`https://a.ppy.sh/${member.uid}`}/>
                                        <Avatar.Fallback>{member.name?.[0] ?? "?"}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <Label>{member.name}</Label>
                                        <Description>#{member.uid}</Description>
                                    </div>
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Autocomplete.Filter>
                </Autocomplete.Popover>
            </Autocomplete>
            <Button
                size="sm"
                variant="primary"
                onPress={handleAddMember}
                className="font-bold px-6"
            >
                添加
            </Button>
        </div>
    )
}

async function getRegistrationInfo(tournament_name: string): Promise<RegistrationInfo[]> {
    const res = await fetch(siteConfig.backend_url + `/api/get-registration-info?tournament_name=${tournament_name}`, {next: {revalidate: 10}});
    return await res.json();
}

async function getPlayers(tournament_name: string): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name, {next: {revalidate: 0}});
    return await res.json();
}
