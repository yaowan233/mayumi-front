"use client"

import React, {Dispatch, SetStateAction, useContext, useEffect, useRef, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {LinkIcon} from "@/components/icons"; // 假设你有这个图标，或者用 lucide-react
import {useRouter, useSearchParams} from "next/navigation";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {
    Accordion,
    Avatar,
    Button,
    Card,
    Chip,
    Input,
    Separator,
} from "@heroui/react";

function isPlayerReserved(playerUID: number | undefined, schedule_stage: ScheduleStage): boolean {
    if (!playerUID) return false;
    if (!schedule_stage.lobby_info) return false;
    return schedule_stage.lobby_info.some((stage_schedule) => (stage_schedule.participants?.some((info) => info.uid.includes(playerUID))));
}

function formatTime(s: string) {
    return s.length === 1 ? '0' + s : s;
}

export const ScheduleComp = ({tabs, tournament_name, tournamentPlayers}: {
    tabs: ScheduleStage[],
    tournament_name: string,
    tournamentPlayers: TournamentPlayers
}) => {
    const [scheduleStages, setScheduleStages] = useState<ScheduleStage []>(tabs);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedStage, setSelectedStage] = useState(searchParams.get('stage') || tabs.at(-1)?.stage_name || tabs[0]?.stage_name || "");
    const selectedScheduleStage = scheduleStages.find((stage) => stage.stage_name === selectedStage) || scheduleStages.at(-1) || scheduleStages[0];

    const handleStageChange = (stageName: string) => {
        setSelectedStage(stageName);
        router.replace(`?stage=${encodeURIComponent(stageName)}`);
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full border-b border-zinc-200 dark:border-white/[0.08]">
                <div className="mx-auto flex max-w-5xl justify-start gap-6 overflow-x-auto px-6 md:justify-center md:px-0">
                    {scheduleStages.map((stage) => {
                        const active = stage.stage_name === selectedScheduleStage?.stage_name;
                        return (
                            <button
                                key={stage.stage_name}
                                type="button"
                                className={`relative h-12 shrink-0 rounded-md px-1 text-lg font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${active ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                                onClick={() => handleStageChange(stage.stage_name)}
                            >
                                {stage.stage_name}
                                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"/>}
                            </button>
                        );
                    })}
                </div>
            </div>
            {selectedScheduleStage && (
                <div className="w-full max-w-5xl mx-auto py-4">
                    {selectedScheduleStage.is_lobby ?
                        <GroupComp schedule={selectedScheduleStage} tournament_name={tournament_name}
                                   tournamentPlayers={tournamentPlayers} setSchedule={setScheduleStages}/> :
                        <TeamComp schedule={selectedScheduleStage} tournament_name={tournament_name}
                                  tournament_players={tournamentPlayers} setSchedule={setScheduleStages}/>
                    }
                </div>
            )}
        </div>
    )
}

// ---------------------- TeamComp (分组/双败) ----------------------
const TeamComp = ({schedule, tournament_name, tournament_players, setSchedule}: {
    schedule: ScheduleStage,
    tournament_name: string,
    tournament_players: TournamentPlayers,
    setSchedule: Dispatch<SetStateAction<ScheduleStage[]>>
}) => {
    if (schedule.match_info == undefined) return null;

    // 提取公共的 Section Title 组件
    const renderBracketHeader = (title: string, color: "success" | "danger" | "primary") => (
        <div className="flex items-center gap-4 my-4">
            <Chip color={color === "primary" ? "accent" : color} variant="soft" size="lg" className="font-bold min-w-fit">
                {title}
            </Chip>
            <Separator className="flex-1" />
        </div>
    );
    const accordionStyle = {
        // base 是每一行的容器
        // 添加: border border-transparent (预留边框位置防止跳动)
        // 添加: hover:border-primary/50 (鼠标移上去变蓝)
        // 调整: transition-all duration-300 (平滑过渡)
        base: "group-[.is-splitted]:px-0 group-[.is-splitted]:bg-surface group-[.is-splitted]:shadow-sm hover:group-[.is-splitted]:bg-surface-secondary border border-default-100/50 hover:border-primary/50 transition-all duration-300 my-2",
        title: "text-default-500",
        trigger: "py-1", // 稍微减小内边距让整体紧凑一点
        content: "pt-0 pb-4 px-4",
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                {renderBracketHeader("胜者组 / Winner Bracket", "success")}
                <Accordion className="flex flex-col gap-2" hideSeparator>
                    {(schedule.match_info || []).filter((match) => match.is_winner_bracket).map((match_info, index) => (
                        <Accordion.Item
                            key={index}
                            id={`${match_info.team1?.name ?? '?'} vs ${match_info.team2?.name ?? '?'}`}
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 transition-colors hover:border-primary/50 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        >
                            <Accordion.Heading>
                                <Accordion.Trigger className="w-full py-1">
                                    <VSInfoComp match_info={match_info}/>
                                    <Accordion.Indicator className="ml-3 h-4 w-4 shrink-0" />
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body className="pt-3 pb-4">
                                    <MatchInfoComp match_info={match_info} stage_name={schedule.stage_name}
                                                   tournament_name={tournament_name} tournament_players={tournament_players}
                                                   setSchedule={setSchedule}/>
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>

            {schedule.match_info?.some((match) => !match.is_winner_bracket) && (
                <div>
                    {renderBracketHeader("败者组 / Loser Bracket", "danger")}
                    <Accordion className="flex flex-col gap-2" hideSeparator>
                        {(schedule.match_info || []).filter((match) => !match.is_winner_bracket).map((match_info, index) => (
                            <Accordion.Item
                                key={index}
                                id={`${match_info.team1?.name ?? '?'} vs ${match_info.team2?.name ?? '?'}`}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 transition-colors hover:border-primary/50 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:bg-zinc-900"
                            >
                                <Accordion.Heading>
                                    <Accordion.Trigger className="w-full py-1">
                                        <VSInfoComp match_info={match_info}/>
                                        <Accordion.Indicator className="ml-3 h-4 w-4 shrink-0" />
                                    </Accordion.Trigger>
                                </Accordion.Heading>
                                <Accordion.Panel>
                                    <Accordion.Body className="pt-3 pb-4">
                                        <MatchInfoComp match_info={match_info} stage_name={schedule.stage_name}
                                                       tournament_name={tournament_name} tournament_players={tournament_players}
                                                       setSchedule={setSchedule}/>
                                    </Accordion.Body>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            )}
        </div>
    )
}


const VSInfoComp = ({ match_info }: { match_info: MatchInfo }) => {
    const score1 = match_info.team1_score ? match_info.team1_score : 0;
    const score2 = match_info.team2_score ? match_info.team2_score : 0;
    const isTeam1Win = score1 > score2;
    const isTeam2Win = score2 > score1;
    const notStarted = score1 === 0 && score2 === 0;

    // 时间处理
    const date = new Date(match_info.datetime);
    const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    const timeStr = `${formatTime(date.getUTCHours().toString())}:${formatTime(date.getUTCMinutes().toString())}`;

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto_1fr_100px] items-center gap-y-2 md:gap-x-4 py-2 w-full">

                {/* 1. 左侧：时间区域 (PC端显示，移动端隐藏或变样式) */}
                <div className="hidden md:flex flex-col items-center justify-center min-w-[80px]">
                    <Chip size="sm" variant="soft" color="accent" className="mb-1 border-none">
                        {dateStr}
                    </Chip>
                    <span className="text-xl font-mono  text-default-700 leading-none">
                        {timeStr}
                    </span>
                </div>

                {/* 移动端的时间显示 (仅在小屏幕显示) */}
                <div className="flex md:hidden items-center justify-center w-full px-2 mb-2 gap-2">
                    <div className="flex gap-2 items-center">
                        <Chip size="sm" variant="soft" color="accent">{dateStr}</Chip>
                        <span className="text-lg font-mono  text-default-700">{timeStr}</span>
                    </div>
                    {/* 移动端把链接放这里 */}
                    <div className="flex gap-2">
                         {match_info.match_url?.filter(u => u !== "").map((url, i) => (
                            <a
                                key={i}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Match-Link"
                            >
                                <LinkIcon className="text-primary w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* 2. 队伍 1 (靠右对齐) */}
                <div className={`flex items-center justify-center md:justify-end gap-3 min-w-0 ${notStarted? "opacity-100" : isTeam1Win ? "opacity-100 font-bold" : "opacity-30"}`}>
                    <span className="text-lg truncate text-center md:text-right hidden  text-default-700 sm:block">
                        {match_info.team1.name}
                    </span>

                    <span className="text-lg truncate text-center md:text-right sm:hidden  text-default-700 max-w-[150px]">
                        {match_info.team1.name}
                    </span>

                    <img
                        alt={match_info.team1.name}
                        className="w-10 h-10 rounded-md md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-surface-secondary"
                        src={match_info.team1.avatar_url || "https://a.ppy.sh"}
                    />
                </div>

                {/* 3. 中间：比分板 */}
                <div className="flex justify-center px-2">
                    <div className="flex items-center justify-center px-5 py-2 bg-default-100/10 rounded-full border border-white/5 min-w-[100px] shadow-inner">
                        <span className={`text-3xl font-mono font-black tabular-nums ${isTeam1Win ? "text-primary drop-shadow-[0_0_8px_rgba(0,111,238,0.6)]" : "text-default-700"}`}>
                            {score1}
                        </span>
                        <span className="mx-3 text-default-600 text-xl font-light pb-1">:</span>
                        <span className={`text-3xl font-mono font-black tabular-nums ${isTeam2Win ? "text-primary drop-shadow-[0_0_8px_rgba(0,111,238,0.6)]" : "text-default-700"}`}>
                            {score2}
                        </span>
                    </div>
                </div>

                {/* 4. 队伍 2 (靠左对齐) */}
                <div className={`flex items-center  justify-center md:justify-start gap-3 min-w-0 ${notStarted? "opacity-100" : isTeam2Win ? "opacity-100 font-bold" : "opacity-30"}`}>
                    <img
                        alt={match_info.team2.name}
                        className="w-10 h-10 rounded-md md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-surface-secondary"
                        src={match_info.team2.avatar_url || "https://a.ppy.sh"}
                    />
                    {/* PC端名字 (保持不变) */}
                    <span className="text-lg truncate text-center md:text-left text-default-700 hidden sm:block">
                        {match_info.team2.name}
                    </span>

                    {/* 移动端名字：关键修改 */}
                    <span className="text-lg truncate text-center md:text-left text-default-700 sm:hidden max-w-[150px]">
                        {match_info.team2.name}
                    </span>
                </div>

                {/* 5. 右侧：操作区 (固定宽度，保证整体居中) */}
                {/* 这里加 justify-end 确保图标靠右，且宽度固定为 100px 与左侧时间对应 */}
                <div className="hidden md:flex justify-end gap-2 min-w-[80px]">
                    {match_info.match_url && match_info.match_url.length > 0 &&
                        match_info.match_url.filter(u => u !== "").map((url, i) => (
                            <a
                                key={i}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Match-Link"
                            >
                                <LinkIcon className="text-primary w-4 h-4" />
                            </a>
                        ))
                    }
                    {/* Accordion 的箭头会自动出现在这里，HeroUI 默认放在最右侧 */}
                    {/* 我们这里留空，让 HeroUI 的箭头自然占据右侧 padding 区域，或者你可以手动控制箭头 */}
                </div>
            </div>
        </div>
    );
};


const MatchInfoComp = ({match_info, stage_name, tournament_name, tournament_players, setSchedule}: {
    match_info: MatchInfo,
    stage_name: string,
    tournament_name: string,
    tournament_players: TournamentPlayers,
    setSchedule: Dispatch<SetStateAction<ScheduleStage[]>>
}) => {
    const currentUser = useContext(CurrentUserContext);
    const playerUID = currentUser?.currentUser?.uid;
    const info = tournament_players.players.find(player => player.uid === playerUID);

    // 封装一个简单的 Section 组件
    const renderInfoSection = ({ title, role, list, canJoin }: any) => (
        <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-lg border border-transparent hover:border-default-200 transition-colors">
            <h4 className="text-small font-bold uppercase text-default-500 mb-1">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {list?.map((person: SimpleInfo) => (
                    (playerUID && person.uid.includes(playerUID)) ?
                        <WithDeletePersonInfo key={person.name} tournament_name={tournament_name} stage_name={stage_name} info={person} lobbyInfo={match_info} role={role} setSchedule={setSchedule}/> :
                        <PersonInfo key={person.name} info={person}/>
                ))}
                {canJoin && !(list?.some((p: SimpleInfo) => playerUID && p.uid.includes(playerUID))) &&
                    <ParticipantJoinHere tournament_name={tournament_name} stage_name={stage_name} lobbyInfo={match_info} role={role} setSchedule={setSchedule}/>}
            </div>
            {(!list || list.length === 0) && !canJoin && <span className="text-tiny text-default-400 italic">None</span>}
        </div>
    );

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderInfoSection({ title: "裁判", role: "referee", list: match_info.referee, canJoin: info?.referee })}
                {renderInfoSection({ title: "直播", role: "streamer", list: match_info.streamer, canJoin: info?.streamer })}
                {renderInfoSection({ title: "解说", role: "commentator", list: match_info.commentators, canJoin: info?.commentator })}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-3 min-w-0">
                    <Chip color="accent" variant="soft" className="self-center">{match_info.team1.name} 热手图</Chip>
                    <div className="w-full">
                        {match_info.team1_warmup ?
                            <MapComp map={match_info.team1_warmup}/> :
                            <div className="text-center text-default-400 py-4">暂无热手图</div>
                        }
                    </div>
                    <WarmupSelect uid={match_info.team1.uid} team={1} match_id={match_info.match_id} stage_name={stage_name} tournament_name={tournament_name} start_time={match_info.datetime}/>
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                    <Chip color="danger" variant="soft" className="self-center">{match_info.team2.name} 热手图</Chip>
                    <div className="w-full">
                        {match_info.team2_warmup ?
                            <MapComp map={match_info.team2_warmup}/> :
                            <div className="text-center text-default-400 py-4">暂无热手图</div>
                        }
                    </div>
                    <WarmupSelect uid={match_info.team2.uid} team={2} match_id={match_info.match_id} stage_name={stage_name} tournament_name={tournament_name} start_time={match_info.datetime}/>
                </div>
            </div>
        </div>
    )
}

const GroupComp = ({schedule, tournament_name, tournamentPlayers, setSchedule}: {
    schedule: ScheduleStage,
    tournament_name: string,
    tournamentPlayers: TournamentPlayers,
    setSchedule: Dispatch<SetStateAction<ScheduleStage[]>>
}) => {
    const currentUser = useContext(CurrentUserContext);
    const playerUID = currentUser?.currentUser?.uid;
    const info = tournamentPlayers.players.find(player => player.uid === playerUID);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schedule.lobby_info?.map((lobby) => {
                 const date = new Date(lobby.datetime);
                 const canJoinPlayer = info?.player && !isPlayerReserved(playerUID, schedule) && !(lobby.participants?.some((p) => playerUID && p.uid.includes(playerUID)));
                 const canJoinRef = info?.referee && !(lobby.referee?.some((r) => playerUID && r.uid.includes(playerUID)));
                 const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
                 const timeStr = `${formatTime(date.getUTCHours().toString())}:${formatTime(date.getUTCMinutes().toString())}`;
                 return (
                    <Card
                        key={lobby.lobby_name}
                        className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-primary/45 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
                    >
                        <Card.Header className="!flex-row items-center justify-between gap-3 !px-4 !py-3">
                            <h3 className="min-w-0 truncate text-lg font-black text-zinc-900 dark:text-zinc-100">{lobby.lobby_name}</h3>
                            <div className="flex shrink-0 items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent" className="border-none font-mono">
                                    {dateStr} · {timeStr}
                                </Chip>
                                {lobby.match_url && lobby.match_url.filter(u => u !== "").length > 0 && (
                                    <a
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                                        href={lobby.match_url.filter(u => u !== "")[0]}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Match-Link"
                                    >
                                        <LinkIcon className="text-primary w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </Card.Header>
                        <Separator className="bg-zinc-200 dark:bg-white/[0.08]" />
                        <Card.Content className="flex flex-col gap-4 !px-4 !py-4">
                            <div className="rounded-lg bg-zinc-100/70 p-3 dark:bg-black/15">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">裁判</span>
                                    <Chip size="sm" variant="soft">{lobby.referee?.length || 0}</Chip>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {lobby.referee?.map((ref) => (
                                        (playerUID && ref.uid.includes(playerUID)) ?
                                            <WithDeletePersonInfo key={ref.name} tournament_name={tournament_name} stage_name={schedule.stage_name} info={ref} lobbyInfo={lobby} role="referee" setSchedule={setSchedule}/> :
                                            <PersonInfo key={ref.name} info={ref}/>
                                    ))}
                                    {canJoinRef && <ParticipantJoinHere tournament_name={tournament_name} stage_name={schedule.stage_name} lobbyInfo={lobby} role="referee" setSchedule={setSchedule}/>}
                                </div>
                            </div>
                            <div className="rounded-lg bg-zinc-100/70 p-3 dark:bg-black/15">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">选手</span>
                                    <Chip size="sm" variant="soft" color={lobby.participants?.length === 16 ? "danger" : "default"}>
                                        {lobby.participants?.length || 0} / 16
                                    </Chip>
                                </div>
                                <div className="flex max-h-[150px] flex-wrap gap-2 overflow-y-auto scrollbar-hide">
                                    {lobby.participants?.map((p) => (
                                        (playerUID && p.uid.includes(playerUID)) ?
                                            <WithDeletePersonInfo key={p.name} tournament_name={tournament_name} stage_name={schedule.stage_name} info={p} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/> :
                                            <PersonInfo key={p.name} info={p}/>
                                    ))}
                                    {canJoinPlayer && <ParticipantJoinHere tournament_name={tournament_name} stage_name={schedule.stage_name} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/>}
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                 )
            })}
        </div>
    )
}

// ---------------------- 人员组件重构 ----------------------

// 使用 HeroUI User 组件，看起来更高级
const PersonInfo = ({info}: { info: SimpleInfo }) => {
    return (
        <a target="_blank" rel="noreferrer" href={`https://osu.ppy.sh/users/${info.uid[0]}`} className="group">
            <Chip
                variant="soft"
                className="h-7 min-h-7 gap-1.5 py-0 pl-1 pr-2 hover:bg-default-200 transition-colors cursor-pointer"
            >
                <span className="inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <img
                        src={info.avatar_url || "https://a.ppy.sh"}
                        alt={info.name}
                        className="h-full w-full rounded-full object-cover"
                    />
                </span>
                <span className="text-xs font-bold leading-none">{info.name}</span>
            </Chip>
        </a>
    )
}


const WithDeletePersonInfo = ({tournament_name, stage_name, info, lobbyInfo, role, setSchedule}: {
    tournament_name: string,
    stage_name: string,
    info: SimpleInfo,
    lobbyInfo: LobbyInfo | MatchInfo,
    role: string,
    setSchedule: Dispatch<SetStateAction<ScheduleStage[]>>
}) => {
    const handleSignOut = async () => {
        if(!confirm("确定要取消报名吗？")) return;

        const res = await fetch(
            siteConfig.backend_url + `/api/sign-out-match?tournament_name=${encodeURIComponent(tournament_name)}&stage_name=${encodeURIComponent(stage_name)}&match_id=${lobbyInfo.match_id}&role=${encodeURIComponent(role)}`,
            { method: "DELETE", credentials: "include" }
        )
        if (!res.ok) {
            alert(await res.text());
        } else {
            setSchedule((prev) => {
                if (prev.find((stage) => stage.stage_name === stage_name)?.is_lobby) {
                    return prev.map((stage) => {
                        if (stage.stage_name == stage_name) {
                            return {
                                ...stage,
                                lobby_info: stage.lobby_info?.map((lobby) => {
                                    if (lobby.match_id == lobbyInfo.match_id) {
                                        if (role === "player") {
                                            return {
                                                ...lobby,
                                                participants: lobby.participants?.filter((participant) => participant.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                        if (role === "referee") {
                                            return {
                                                ...lobby,
                                                referee: lobby.referee?.filter((referee) => referee.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                    }
                                    return lobby
                                })
                            }
                        }
                        return stage
                    })
                }
                if (!prev.find((stage) => stage.stage_name === stage_name)?.is_lobby) {
                    return prev.map((stage) => {
                        if (stage.stage_name == stage_name) {
                            return {
                                ...stage,
                                match_info: stage.match_info?.map((match) => {
                                    if (match.match_id == lobbyInfo.match_id) {
                                        if (role === "referee") {
                                            return {
                                                ...match,
                                                referee: match.referee?.filter((referee) => referee.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                        if (role === "streamer") {
                                            return {
                                                ...match,
                                                streamer: match.streamer?.filter((streamer) => streamer.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                        if (role === "commentator") {
                                            return {
                                                ...match,
                                                commentators: match.commentators?.filter((commentator) => commentator.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                    }
                                    return match
                                })
                            }
                        }
                        return stage
                    })
                }
                return prev
            })
        }
    };

    return (
        <Chip
            variant="soft"
            color="accent"
            className="h-7 min-h-7 gap-1.5 py-0 pl-1 pr-1 hover:bg-primary/20 transition-colors"
        >
            <span className="inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full">
                <img
                    src={info.avatar_url || "https://a.ppy.sh"}
                    alt={info.name}
                    className="h-full w-full rounded-full object-cover"
                />
            </span>
            <span className="text-xs font-bold leading-none">{info.name}</span>
            <button
                type="button"
                className="ml-0.5 inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full text-xs leading-none transition-all hover:bg-black/10 hover:text-danger active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 dark:hover:bg-white/10 dark:hover:text-danger"
                onClick={handleSignOut}
                aria-label="取消报名"
            >
                x
            </button>
        </Chip>
    )
}


const ParticipantJoinHere = ({tournament_name, stage_name, lobbyInfo, role, setSchedule}: {
    tournament_name: string,
    stage_name: string,
    lobbyInfo: LobbyInfo | MatchInfo,
    role: string,
    setSchedule: Dispatch<SetStateAction<ScheduleStage[]>>
}) => {
    return (
        <Button
            size="sm"
            variant="primary"
            className="h-6 min-h-6 px-2 border-1"
            onPress={async () => {
                  const res = await fetch(
                      siteConfig.backend_url + `/api/signup-match?tournament_name=${encodeURIComponent(tournament_name)}&stage_name=${encodeURIComponent(stage_name)}&match_id=${lobbyInfo.match_id}&role=${encodeURIComponent(role)}`,
                      { method: "POST", credentials: "include" }
                  )
                   if (!res.ok) {
                      alert(await res.text());
                  } else {
                      const simpleInfo = await res.json()
                      setSchedule((prev) => {
                          if (prev.find((stage) => stage.stage_name === stage_name)?.is_lobby) {
                              return prev.map((stage) => {
                                  if (stage.stage_name == stage_name) {
                                      return {
                                          ...stage,
                                          lobby_info: stage.lobby_info?.map((lobby) => {
                                              if (lobby.match_id == lobbyInfo.match_id) {
                                                  if (role === "player") {
                                                      return {
                                                          ...lobby,
                                                          participants: [...lobby.participants as SimpleInfo[], simpleInfo]
                                                      }
                                                  } else {
                                                      return {
                                                          ...lobby,
                                                          referee: [...lobby.referee as SimpleInfo[], simpleInfo]
                                                      }
                                                  }
                                              }
                                              return lobby
                                          })
                                      }
                                  }
                                  return stage
                              })
                          }
                          if (!prev.find((stage) => stage.stage_name === stage_name)?.is_lobby) {
                              return prev.map((stage) => {
                                  if (stage.stage_name == stage_name) {
                                      return {
                                          ...stage,
                                          match_info: stage.match_info?.map((match) => {
                                              if (match.match_id == lobbyInfo.match_id) {
                                                  if (role === "referee") {
                                                      return {
                                                          ...match,
                                                          referee: [...match.referee as SimpleInfo[], simpleInfo]
                                                      }
                                                  }
                                                  if (role === "streamer") {
                                                      return {
                                                          ...match,
                                                          streamer: [...match.streamer as SimpleInfo[], simpleInfo]
                                                      }
                                                  }
                                                  if (role === "commentator") {
                                                      return {
                                                          ...match,
                                                          commentators: [...match.commentators as SimpleInfo[], simpleInfo]
                                                      }
                                                  }
                                              }
                                              return match
                                          })
                                      }
                                  }
                                  return stage
                              })
                          }
                          return prev
                      })
                      alert("报名成功")
                  }
            }}
        >
            加入
        </Button>
    )
}

// ---------------------- 地图卡片美化 MapComp ----------------------
const MapComp = ({map}: { map: map }) => {
  return (
    <Card className="w-full h-[110px] sm:h-[120px] shadow-sm group border-none">

      <img
        alt="Beatmap Cover"
        className="z-0 w-full h-full object-cover absolute top-0 left-0 brightness-[0.55] group-hover:scale-105 transition-transform duration-500"
        src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
      />

      {/* 渐变层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* 内容层 */}
      <div className="z-20 relative h-full flex flex-col justify-between p-3 text-white">

        {/* --- 上半部分：标题与作者 --- */}
        <div className="flex flex-col gap-0 min-w-0">
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://osu.ppy.sh/b/${map.map_id}`}
            className="text-white hover:text-primary transition-colors block"
          >
            <h4
              className="font-bold text-base sm:text-lg leading-tight truncate w-full drop-shadow-sm"
              title={map.map_name}
            >
              {map.map_name}
            </h4>
          </a>

          <div className="flex items-center gap-2 text-xs text-white/80 overflow-hidden mt-0.5">
             {/* 难度名 */}
            <span
                className="bg-white/10 px-1.5 py-[1px] rounded text-white/90 truncate max-w-[55%] shrink-0 border border-white/10"
                title={map.diff_name}
            >
              [{map.diff_name}]
            </span>
            <span className="truncate shrink min-w-0 opacity-80">
              by {map.mapper}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end gap-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-0.5">
             <StatItem label="CS" value={map.cs} />
             <StatItem label="AR" value={map.ar} />
             <StatItem label="OD" value={map.od} />
             <StatItem label="HP" value={map.hp} />
          </div>

          {/* 右侧：星数 */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg leading-none">
              <span className="text-xs mt-0.5">★</span> {map.star_rating}
            </div>
            <div className="text-[10px] sm:text-xs text-white/60 font-mono mt-0.5">
              {map.bpm} BPM
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};


const StatItem = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex items-baseline gap-1">
    {/* 标签：小、半透明、大写 */}
    <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm font-bold text-white leading-none">
      {value}
    </span>
  </div>
);


const WarmupSelect = ({uid, team, tournament_name, stage_name, match_id, start_time}: any) => {
    const [map_id, setMapId] = useState("");
    const [preview, setPreview] = useState<map | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = useContext(CurrentUserContext);
    const invalidMapId = map_id === "" || isNaN(parseInt(map_id));

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (invalidMapId) {
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setPreviewLoading(true);
            setPreviewError(null);
            setPreview(null);
            try {
                const res = await fetch(`/api/beatmap-preview?map_id=${encodeURIComponent(map_id)}`);
                const data = await res.json();
                if (!res.ok) {
                    setPreviewError(data.error ?? "查询失败");
                } else {
                    setPreview(data);
                }
            } catch {
                setPreviewError("网络错误，无法预览地图");
            } finally {
                setPreviewLoading(false);
            }
        }, 600);
    }, [invalidMapId, map_id]);

    if (!uid.includes(currentUser?.currentUser?.uid) || new Date(start_time) < new Date()) {
        return null
    }
    return (
        <div className="flex flex-col gap-2 w-full mt-2">
            <div className="flex flex-row gap-2 items-end w-full">
                <label className="flex flex-grow flex-col gap-1 text-sm">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">更换热手图</span>
                    <Input
                        placeholder="Beatmap ID（例如 123456）"
                        value={map_id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapId(e.target.value)}
                    />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">注意：请输入单个难度的 Beatmap ID，而非谱面集 Beatmapset ID</span>
                </label>
                <Button size="sm" variant="primary" className="mb-5" onPress={async () => {
                    if (map_id == "" || isNaN(parseInt(map_id))) {
                        alert("请输入正确的 Beatmap ID（纯数字）");
                        return;
                    }
                    try {
                        const res = await fetch(
                            siteConfig.backend_url + `/api/update-warmup?map_id=${encodeURIComponent(map_id)}&team=${encodeURIComponent(team)}&tournament_name=${encodeURIComponent(tournament_name)}&stage_name=${encodeURIComponent(stage_name)}&match_id=${match_id}`,
                            { method: "PATCH", credentials: "include" }
                        )
                        if (!res.ok) {
                            const errText = await res.text();
                            alert(`提交失败：${errText}`);
                            return;
                        }
                        alert('更新成功 请等待服务器更新后 刷新页面查看');
                    } catch (e) {
                        alert("网络错误，无法连接到服务器，请检查网络后重试");
                    }
                }}>
                    提交
                </Button>
            </div>
            {!invalidMapId && previewLoading && (
                <div className="text-xs text-default-400 px-1">正在查询地图信息…</div>
            )}
            {!invalidMapId && previewError && (
                <div className="text-xs text-danger px-1">{previewError}</div>
            )}
            {!invalidMapId && preview && <MapComp map={preview} />}
        </div>
    )
}

export interface ScheduleStage {
    stage_name: string;
    is_lobby: boolean;
    lobby_info?: LobbyInfo[]
    match_info?: MatchInfo[]
}

type LobbyInfo = {
    lobby_name: string;
    match_id: string;
    datetime: string;
    match_url?: string[];
    referee?: SimpleInfo[];
    participants?: SimpleInfo[];
}

export type MatchInfo = {
    datetime: string;
    is_winner_bracket: boolean;
    match_id: string;
    match_url?: string[];
    referee?: SimpleInfo[];
    streamer?: SimpleInfo[];
    commentators?: SimpleInfo[];
    team1: SimpleInfo
    team2: SimpleInfo
    team1_score?: number;
    team2_score?: number;
    team1_warmup?: map;
    team2_warmup?: map;
}

type SimpleInfo = {
    name: string;
    avatar_url: string;
    uid: number[];
}


interface map {
    map_id: string;
    map_set_id: string;
    map_name: string;
    mapper: string;
    star_rating: string;
    ar: string;
    od: string;
    cs: string;
    hp: string;
    bpm: string;
    length: string;
    drain_time: string;
    number: string;
    diff_name: string;
}
