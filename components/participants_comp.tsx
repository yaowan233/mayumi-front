"use client"

import {Tab, Tabs} from "@heroui/tabs";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Image} from "@heroui/image";
import {Link} from "@heroui/link";
import {Tooltip} from "@heroui/tooltip";
import {Chip} from "@heroui/chip";
import {User} from "@heroui/user";
import {useMemo} from "react";

// --- 图标组件 ---
const CrownIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="text-warning"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" /></svg>
);
const UserGroupIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export const ParticipantsComp = ({tournament_players}: { tournament_players: TournamentPlayers }) => {
    const players = tournament_players.players || [];
    const teams = tournament_players.groups || [];

    // 排序逻辑
    const sortedSoloPlayers = useMemo(() => {
        return players
            .filter(p => p.player)
            .sort((a, b) => b.pp - a.pp);
    }, [players]);

    return (
        <div className="w-full flex flex-col gap-6">
            <Tabs
                aria-label="Participants Options"
                    className="w-full"
                    size="lg"
                    variant="underlined"
                    color="primary"
                    defaultSelectedKey={teams.length>0 ? "teams" : "solo"}
                    classNames={{
                        tabList: "w-full relative rounded-none p-0 border-b border-divider overflow-x-auto scrollbar-hide flex justify-start md:justify-center",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-6 h-12",
                        tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-bold text-lg",
                        panel: "pt-6 w-full max-w-7xl mx-auto"
                    }}
            >
                {teams.length > 0 && (
                    <Tab key="teams" title={`队伍 (${teams.length})`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {teams.map((team, idx) => (
                                <TeamCard key={idx} team={team} allPlayers={players} />
                            ))}
                        </div>
                    </Tab>
                )}

                {/* --- 报名人员 Tab --- */}
                <Tab key="solo" title="报名人员">
                    <div className="flex flex-col gap-6">

                        <div className="flex items-center gap-3 px-1">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <UserGroupIcon />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-default-500 tracking-wider">总报名人数</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-foreground">{sortedSoloPlayers.length}</span>
                                    <span className="text-sm text-default-400">人已报名</span>
                                </div>
                            </div>
                            {/* 如果需要右侧放东西（比如导出按钮），可以加在这里，用 ml-auto 挤过去 */}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedSoloPlayers.map((player) => (
                                <SoloPlayerCard key={player.uid} player={player} />
                            ))}
                        </div>

                        {sortedSoloPlayers.length === 0 && (
                            <div className="text-center py-20 text-default-400 bg-content1/50 rounded-xl border-dashed border-2 border-default-200">
                                暂无报名选手
                            </div>
                        )}
                    </div>
                </Tab>
            </Tabs>
        </div>
    )
}

// --- 子组件：队伍卡片 ---
const TeamCard = ({team, allPlayers}: {team: any, allPlayers: any[]}) => {
    return (
        <Card className="border border-white/5 bg-content1 shadow-sm hover:shadow-md hover:border-primary/30 transition-all h-full">
            <CardHeader className="flex gap-4 items-center bg-default-50/50 pb-4">
                <Image
                    alt={team.name}
                    height={48}
                    width={48}
                    radius="md"
                    className="object-cover bg-black/20"
                    src={team.icon_url || "https://a.ppy.sh"}
                />
                <div className="flex flex-col flex-grow min-w-0">
                    <p className="text-medium font-bold truncate text-foreground" title={team.name}>{team.name}</p>
                    <div className="flex gap-2 text-xs text-default-500">
                        <span>{team.captains.length + team.members.length} Members</span>
                    </div>
                </div>
            </CardHeader>
            <div className="h-[1px] bg-divider w-full"/>
            <CardBody className="flex flex-col gap-1 p-2">
                {team.captains.map((uid: number) => {
                    const player = allPlayers.find(p => p.uid === uid);
                    if (!player) return null;
                    return <PlayerRow key={uid} player={player} isCaptain={true} />;
                })}
                {team.members.map((uid: number) => {
                    const player = allPlayers.find(p => p.uid === uid);
                    if (!player) return null;
                    return <PlayerRow key={uid} player={player} isCaptain={false} />;
                })}
            </CardBody>
        </Card>
    )
}

// --- 子组件：队伍内的单行选手 ---
const PlayerRow = ({player, isCaptain}: {player: any, isCaptain: boolean}) => {
    return (
        <div className={`flex items-center justify-between p-1.5 rounded-md transition-colors ${isCaptain ? 'bg-warning/10 text-warning-600' : 'hover:bg-default-100 text-default-600'}`}>
            <div className="flex items-center gap-2 overflow-hidden">
                <User
                    name={player.name}
                    avatarProps={{
                        src: `https://a.ppy.sh/${player.uid}`,
                        size: "sm",
                        isBordered: isCaptain,
                        color: isCaptain ? "warning" : "default",
                        className: "w-5 h-5 text-tiny" // 稍微调小一点，让队伍列表更紧凑
                    }}
                    classNames={{
                        name: `truncate text-small ${isCaptain ? 'font-bold' : ''}`,
                    }}
                    as={Link}
                    href={`https://osu.ppy.sh/u/${player.uid}`}
                    isExternal
                />
                {isCaptain && <CrownIcon />}
            </div>
            <span className="text-[10px] font-mono opacity-70">#{player.rank}</span>
        </div>
    )
}

// --- 子组件：Solo 选手卡片 ---
const SoloPlayerCard = ({player}: {player: any}) => {
    return (
        <Card className="border border-white/5 bg-content1 hover:bg-content2 transition-all group">
            {/* 减少 padding，让卡片更紧凑，适合大量展示 */}
            <CardBody className="flex flex-row items-center justify-between p-3 gap-3 overflow-hidden">
                <User
                    name={player.name}
                    description={
                        <div className="flex gap-2 text-xs text-default-400">
                            <span>PP: {Math.round(player.pp)}</span>
                        </div>
                    }
                    avatarProps={{
                        src: `https://a.ppy.sh/${player.uid}`,
                        radius: "md",
                        className: "transition-transform group-hover:scale-105 shrink-0"
                    }}
                    as={Link}
                    href={`https://osu.ppy.sh/u/${player.uid}`}
                    isExternal
                    classNames={{
                        name: "font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-[120px]",
                        description: "truncate"
                    }}
                />

                {/* Rank Chip */}
                <div className="shrink-0">
                    <Chip
                        size="sm"
                        variant="flat"
                        color="default"
                        classNames={{content: "font-mono font-bold text-default-500"}}
                    >
                        #{player.rank}
                    </Chip>
                </div>
            </CardBody>
        </Card>
    )
}