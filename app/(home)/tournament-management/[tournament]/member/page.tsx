"use client";

import React, { useContext, useEffect, useState } from "react";
import CurrentUserContext from "@/app/user_context";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { useFilter } from "@react-aria/i18n";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { RegistrationInfo } from "@/components/homepage";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { siteConfig } from "@/config/site";
import { Player, TournamentPlayers } from "@/app/tournaments/[tournament]/participants/page";
import { Badge } from "@heroui/badge";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";

// --- 配置 ---
const ROLES = [
    { key: "host", label: "主办 (Host)" },
    { key: "player", label: "选手 (Player)" },
    { key: "referee", label: "裁判 (Referee)" },
    { key: "streamer", label: "直播 (Streamer)" },
    { key: "commentator", label: "解说 (Commentator)" },
    { key: "mappooler", label: "选图 (Mappooler)" },
    { key: "custom_mapper", label: "作图 (Mapper)" },
    { key: "graphic_designer", label: "设计 (Designer)" },
    { key: "scheduler", label: "时间安排 (Scheduler)" },
    { key: "map_tester", label: "测图 (Tester)" },
    { key: "donator", label: "赞助 (Donator)" },
] as const;

// --- 图标 ---
const SaveIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const UserIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);

const columns = [
    {name: "UID", key: "uid"},
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
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({ players: [] });
    const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const tournament_name = decodeURIComponent(params.tournament);
    const players = tournamentPlayers.players || [];
    const teams = tournamentPlayers.groups;

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                setIsLoading(true);
                try {
                    const [data, regInfo] = await Promise.all([
                        getPlayers(tournament_name),
                        getRegistrationInfo(tournament_name)
                    ]);
                    setTournamentPlayers(data);
                    setRegistrationInfo(regInfo);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-members', {
                'method': 'POST',
                'body': JSON.stringify(players),
                'headers': { 'Content-Type': 'application/json' },
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
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in pb-32">

            {/* Header: 修复文字颜色和边框 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-default-200 dark:border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <UserIcon /> 成员管理
                    </h1>
                    <p className="text-default-500 mt-1">管理各职位成员权限及查看申请列表</p>
                </div>

                <div className="flex items-center gap-4">
                    <Badge content={registrationInfo.length} color="danger" isInvisible={registrationInfo.length === 0}>
                        <Button color="secondary" variant="flat" onPress={onOpen}>
                            查看申请列表
                        </Button>
                    </Badge>
                </div>
            </div>

            {/* Modal 保持不变，HeroUI Modal 默认支持亮/暗色 */}
            <Modal size="5xl" isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Staff 申请列表 ({registrationInfo.length})</ModalHeader>
                            <ModalBody>
                                <Table aria-label="Applications">
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.key}>{column.name}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={registrationInfo} emptyContent="暂无申请">
                                        {(item) => (
                                            <TableRow key={item.uid}>
                                                {(columnKey) => (
                                                    <TableCell>
                                                        {columnKey === 'selectedPositions'
                                                            ? (getKeyValue(item, columnKey) as string[]).join("，")
                                                            : getKeyValue(item, columnKey)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>关闭</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Main Content: Role Management Tabs */}
            <div className="flex flex-col gap-4">
                <Tabs
                    aria-label="Role Management"
                    variant="light"
                    color="primary"
                    classNames={{
                        base: "w-full",
                        // 修复：背景色适配亮/暗
                        // 亮色: bg-default-100/80 border-default-200
                        // 暗色: dark:bg-zinc-900/80 dark:border-white/10
                        tabList: "p-2 gap-2 w-full flex-wrap justify-start bg-default-100/80 dark:bg-zinc-900/80 border border-default-200 dark:border-white/10 rounded-2xl sticky top-4 z-40 backdrop-blur-md shadow-sm",
                        cursor: "w-full bg-primary/20 border border-primary/50 shadow-sm rounded-lg",
                        tab: "max-w-fit px-4 h-10 data-[selected=true]:text-primary-500 text-default-500 transition-colors",
                        tabContent: "group-data-[selected=true]:font-bold text-sm sm:text-base",
                        panel: "pt-6"
                    }}
                >
                    {ROLES.map((role) => (
                        <Tab key={role.key} title={role.label}>
                            {/* 修复：内容卡片背景色 */}
                            {/* 亮色: bg-content1 (白) border-default-200 */}
                            <Card className="bg-content1 dark:bg-zinc-900/50 border border-default-200 dark:border-white/5 shadow-sm">
                                <CardBody className="p-6 sm:p-8">
                                    <RoleManagementSection
                                        roleKey={role.key as keyof Player}
                                        roleLabel={role.label}
                                        players={players}
                                        teams={teams}
                                        setTournamentPlayers={setTournamentPlayers}
                                        currentUid={currentUser?.currentUser?.uid}
                                        tournamentName={tournament_name}
                                    />
                                </CardBody>
                            </Card>
                        </Tab>
                    ))}
                </Tabs>
            </div>

            {/* Sticky Footer: 修复背景色 */}
            <Card className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">
                    <div className="text-default-500 text-sm">
                        * 修改后请务必点击保存
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
                        {isSaving ? "正在保存..." : "保存所有更改"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
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
        setTournamentPlayers({ players: updatedMembers, groups: teams });
    };

    const currentMembers = players.map((p: any, i: number) => ({...p, originalIndex: i})).filter((p: any) => p[roleKey]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-default-100 dark:border-white/5">
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
                        <Chip
                            key={member.uid}
                            onClose={() => removeMember(member.originalIndex)}
                            variant="bordered"
                            // 修复：Chip 样式适配
                            // 亮色: bg-default-50 border-default-200 text-foreground
                            // 暗色: dark:bg-black/40 dark:border-white/10 dark:text-white
                            classNames={{
                                base: "h-14 py-1 px-2 border border-default-200 dark:border-white/10 bg-default-50 dark:bg-black/40 hover:bg-default-100 dark:hover:bg-zinc-800 hover:border-primary/50 transition-all cursor-default gap-3 rounded-xl",
                                content: "font-medium text-foreground dark:text-white pl-1 pr-2 text-base",
                                closeButton: "text-default-400 hover:text-danger hover:bg-danger/10 rounded-full p-1"
                            }}
                            avatar={
                                <Avatar
                                    src={`https://a.ppy.sh/${member.uid}`}
                                    className="w-10 h-10 border-2 border-white/50 dark:border-white/10"
                                    showFallback
                                />
                            }
                        >
                            <div className="flex flex-col justify-center h-full">
                                <span className="leading-none">{member.name}</span>
                                <span className="text-[10px] text-default-400 font-mono leading-tight mt-0.5">#{member.uid}</span>
                            </div>
                        </Chip>
                    ))
                ) : (
                    // 修复：空状态边框和颜色
                    <div className="w-full flex flex-col items-center justify-center py-12 text-default-400 border-2 border-dashed border-default-200 dark:border-white/5 rounded-xl bg-default-50 dark:bg-white/5">
                        <span className="text-4xl mb-2 opacity-50">∅</span>
                        <span>暂无 {roleLabel.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 子组件：添加成员 ---
const AddMember = ({ members, teams, setMembers, tournamentName, position }: any) => {
    const [fieldState, setFieldState] = useState<{selectedKey: string | null, inputValue: string, items: any[]}>({
        selectedKey: null,
        inputValue: "",
        items: members
    });
    let { contains } = useFilter({ sensitivity: 'base' });

    const onInputChange = (value: string) => {
        setFieldState((prev: any) => ({
            inputValue: value,
            selectedKey: value === "" ? "" : prev.selectedKey,
            items: members.filter((item: any) => contains(item.uid.toString() + item.name, value)),
        }));
    };

    const onSelectionChange = (key: React.Key | null) => {
        if (!key) return;
        // 选中下拉项时，自动填入输入框
        setFieldState(prev => ({
            ...prev,
            inputValue: key.toString(),
            selectedKey: key.toString()
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
                host: false, player: false, referee: false, streamer: false, commentator: false,
                mappooler: false, custom_mapper: false, graphic_designer: false, scheduler: false, map_tester: false, donator: false,
                [position]: true,
                pp: data.statistics.pp,
                rank: data.statistics.global_rank,
                country: data.country_code,
            };
            setMembers({players: [...members, newMember], groups: teams});
            setFieldState({
                    selectedKey: null, // 清空选中键
                    inputValue: "",    // 清空输入文字
                    items: members     // 重置列表
                });
        } catch (e) {
            alert('添加失败：用户不存在或网络错误');
        }
    };

    return (
        // 修复：添加框背景色
        // 亮色: bg-default-100 border-default-200
        // 暗色: dark:bg-zinc-900/50 dark:border-white/5
        <div className="flex gap-2 w-full md:w-auto items-center bg-default-100 dark:bg-zinc-900/50 p-1.5 rounded-lg border border-default-200 dark:border-white/5">
            <Autocomplete
                aria-label="成员搜索框"
                placeholder="输入 UID 添加..."
                allowsCustomValue
                className="w-full md:w-64"
                inputValue={fieldState.inputValue}
                items={fieldState.items || []}
                selectedKey={fieldState.selectedKey}
                onInputChange={onInputChange}
                onSelectionChange={onSelectionChange}
                size="sm"
                variant="flat"
                classNames={{
                    base: "bg-transparent",
                }}
                inputProps={{
                    classNames: {
                        // 修复：输入框背景色适配
                        inputWrapper: "bg-transparent shadow-none border border-transparent hover:bg-default-200/50 dark:hover:bg-white/5 data-[hover=true]:bg-default-200/50 dark:data-[hover=true]:bg-white/5",
                        input: "text-small text-foreground",
                    }
                }}
            >
                {(member: any) => (
                    <AutocompleteItem key={member.uid} textValue={member.uid.toString()}>
                        <div className="flex gap-2 items-center">
                            <Avatar src={`https://a.ppy.sh/${member.uid}`} size="sm" />
                            <div className="flex flex-col">
                                <span className="text-small">{member.name}</span>
                                <span className="text-tiny text-default-400">{member.uid}</span>
                            </div>
                        </div>
                    </AutocompleteItem>
                )}
            </Autocomplete>
            <Button
                color="primary"
                size="sm"
                onPress={handleAddMember}
                className="font-bold px-6 shadow-md"
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