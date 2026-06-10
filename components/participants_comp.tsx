"use client"

import {Avatar, Card, Chip, Tabs} from "@heroui/react";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import NextImage from "next/image";
import {useMemo} from "react";
import GameModeIcon, {GameMode} from "@/components/gamemode_icon";

// --- 图标组件 ---
const CrownIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" /></svg>
);
const UserGroupIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const roleBadges = [
    {key: "host", label: "Host", className: "bg-fuchsia-500/15 text-fuchsia-300"},
    {key: "referee", label: "Referee", className: "bg-emerald-500/15 text-emerald-300"},
    {key: "streamer", label: "Streamer", className: "bg-red-500/15 text-red-300"},
    {key: "commentator", label: "Commentator", className: "bg-amber-500/15 text-amber-300"},
    {key: "mappooler", label: "Mappooler", className: "bg-sky-500/15 text-sky-300"},
    {key: "custom_mapper", label: "Mapper", className: "bg-indigo-500/15 text-indigo-300"},
    {key: "map_tester", label: "Tester", className: "bg-cyan-500/15 text-cyan-300"},
    {key: "scheduler", label: "Scheduler", className: "bg-lime-500/15 text-lime-300"},
    {key: "graphic_designer", label: "Designer", className: "bg-pink-500/15 text-pink-300"},
    {key: "donator", label: "Donator", className: "bg-orange-500/15 text-orange-300"},
];

const RoleBadges = ({player}: { player: any }) => {
    const roles = roleBadges.filter((role) => player[role.key]);
    if (roles.length === 0) return null;

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {roles.map((role) => (
                <span key={role.key} className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role.className}`}>
                    {role.label}
                </span>
            ))}
        </div>
    );
};

const getInitials = (name?: string) => (name || "?").trim().slice(0, 2).toUpperCase();

export const ParticipantsComp = ({tournament_players}: { tournament_players: TournamentPlayers }) => {
    const players = useMemo(() => tournament_players.players ?? [], [tournament_players.players]);
    const teams = useMemo(() => tournament_players.groups ?? [], [tournament_players.groups]);

    // 排序逻辑
    const sortedSoloPlayers = useMemo(() => {
        return players
            .filter(p => p.player)
            .sort((a, b) => b.pp - a.pp);
    }, [players]);

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
            <Tabs
                className="w-full"
                defaultSelectedKey={teams.length>0 ? "teams" : "solo"}
            >
                <Tabs.ListContainer className="w-full">
                    <Tabs.List aria-label="Participants Options" className="w-full relative !rounded-none !bg-transparent p-0 border-b border-divider overflow-x-auto scrollbar-hide flex justify-start md:justify-center">
                        {teams.length > 0 && (
                            <Tabs.Tab id="teams" className="max-w-fit h-12 !rounded-none !bg-transparent px-6 text-lg font-bold text-default-500 transition-colors hover:text-foreground data-[selected=true]:text-primary">
                                {`队伍 (${teams.length})`}
                                <Tabs.Indicator className="!top-auto !bottom-0 !h-0.5 !rounded-none !bg-primary" />
                            </Tabs.Tab>
                        )}
                        <Tabs.Tab id="solo" className="max-w-fit h-12 !rounded-none !bg-transparent px-6 text-lg font-bold text-default-500 transition-colors hover:text-foreground data-[selected=true]:text-primary">
                            报名人员
                            <Tabs.Indicator className="!top-auto !bottom-0 !h-0.5 !rounded-none !bg-primary" />
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
                {teams.length > 0 && (
                    <Tabs.Panel id="teams" className="pt-6 w-full max-w-7xl mx-auto">
                        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {teams.map((team, idx) => (
                                <TeamCard key={idx} team={team} allPlayers={players} />
                            ))}
                        </div>
                    </Tabs.Panel>
                )}

                <Tabs.Panel id="solo" className="pt-6 w-full max-w-7xl mx-auto">
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

                        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedSoloPlayers.map((player) => (
                                <SoloPlayerCard key={player.uid} player={player} />
                            ))}
                        </div>

                        {sortedSoloPlayers.length === 0 && (
                            <div className="text-center py-20 text-default-400 bg-surface/50 rounded-xl border-dashed border-2 border-default-200">
                                暂无报名选手
                            </div>
                        )}
                    </div>
                </Tabs.Panel>
            </Tabs>
        </div>
    )
}

// --- 子组件：队伍卡片 ---
const TeamCard = ({team, allPlayers}: {team: any, allPlayers: any[]}) => {
    return (
        <Card variant="transparent" className="group h-full rounded-xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-colors duration-200 hover:border-primary/40 hover:bg-zinc-100 dark:border-white/[0.10] dark:bg-zinc-900/90 dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)] dark:hover:bg-zinc-800/90">
            <Card.Header className="flex flex-row items-center gap-3 border-b border-zinc-200 px-3 py-3 dark:border-white/[0.08]">
                <NextImage
                    alt={team.name}
                    height={48}
                    width={48}
                    className="h-12 w-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-900"
                    src={team.icon_url || "https://a.ppy.sh"}
                />
                <div className="flex flex-col flex-grow min-w-0">
                    <p className="truncate text-base font-black text-zinc-900 dark:text-zinc-100" title={team.name}>{team.name}</p>
                    <div className="mt-1 flex gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <span>{team.captains.length + team.members.length} 名成员</span>
                    </div>
                </div>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2 px-2 pb-3 pt-2">
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
            </Card.Content>
        </Card>
    )
}

// --- 子组件：队伍内的单行选手 ---
const PlayerRow = ({player, isCaptain}: {player: any, isCaptain: boolean}) => {
    return (
        <div className={`group/player flex min-h-9 items-center justify-between gap-3 rounded-lg px-3 py-1.5 transition-all duration-150 hover:translate-x-0.5 ${isCaptain ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-200' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.07]'}`}>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <a
                    href={`https://osu.ppy.sh/u/${player.uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-inherit no-underline"
                >
                    <Avatar size="sm" className="h-8 w-8 shrink-0 rounded-full text-tiny transition-transform duration-150 group-hover/player:scale-105">
                        <Avatar.Image className="h-full w-full rounded-full object-cover" src={`https://a.ppy.sh/${player.uid}`} alt={player.name}/>
                        <Avatar.Fallback className="h-full w-full rounded-full text-tiny">{getInitials(player.name)}</Avatar.Fallback>
                    </Avatar>
                    <span className={`truncate text-sm transition-colors group-hover/player:text-primary dark:group-hover/player:text-primary ${isCaptain ? 'font-black' : 'font-bold'}`}>
                        {player.name}
                    </span>
                </a>
                {isCaptain && <CrownIcon />}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
                {player.default_mode && (
                    <GameModeIcon mode={player.default_mode as GameMode} size={12} color="currentColor" />
                )}
                <span className="rounded-full bg-zinc-200 px-2 py-1 text-[11px] font-mono font-bold text-zinc-600 dark:bg-white/[0.07] dark:text-zinc-400">
                    #{player.rank?.toLocaleString() || 0}
                </span>
            </div>
        </div>
    )
}

// --- 子组件：Solo 选手卡片 ---
const SoloPlayerCard = ({player}: {player: any}) => {
    return (
        <Card variant="transparent" className="group !p-0 rounded-xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-colors duration-200 hover:border-primary/40 hover:bg-zinc-100 dark:border-white/[0.10] dark:bg-zinc-900/90 dark:shadow-[0_10px_30px_rgba(0,0,0,0.22)] dark:hover:bg-zinc-800/90">
            <Card.Content className="flex flex-row items-center justify-between gap-3 overflow-hidden !px-3 !py-3">
                <div className="min-w-0">
                    <a
                        href={`https://osu.ppy.sh/u/${player.uid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-3 text-inherit no-underline"
                    >
                        <Avatar className="h-10 w-10 shrink-0 rounded-md transition-transform group-hover:scale-105">
                            <Avatar.Image className="h-full w-full rounded-md object-cover" src={`https://a.ppy.sh/${player.uid}`} alt={player.name}/>
                            <Avatar.Fallback className="h-full w-full rounded-md">{getInitials(player.name)}</Avatar.Fallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="font-bold text-zinc-900 group-hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-[120px] dark:text-zinc-100 dark:group-hover:text-primary">
                                {player.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {player.default_mode && (
                                    <GameModeIcon mode={player.default_mode as GameMode} size={12} color="currentColor" />
                                )}
                                <span>PP: {Math.round(player.pp).toLocaleString()}</span>
                            </div>
                        </div>
                    </a>
                </div>

                <div className="shrink-0">
                    <Chip className="bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-white/[0.07] dark:text-zinc-400">
                        <span className="font-mono font-bold">#{player.rank?.toLocaleString() || 0}</span>
                    </Chip>
                </div>
            </Card.Content>
        </Card>
    )
}
