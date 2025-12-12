"use client"

import {Card, CardBody, CardHeader} from "@heroui/card";
import {Tab, Tabs} from "@heroui/tabs";
import {Image} from "@heroui/image";
import {Link} from "@heroui/link";
import {Divider} from "@heroui/divider";
import {Accordion, AccordionItem} from "@heroui/accordion";
import React, {Dispatch, SetStateAction, useContext, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import {siteConfig} from "@/config/site";
import {LinkIcon} from "@/components/icons"; // 假设你有这个图标，或者用 lucide-react
import {useRouter, useSearchParams} from "next/navigation";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";


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

    return (
        <div className="w-full flex flex-col items-center">
             {/* 增加背景容器或样式优化 */}
            <Tabs
                aria-label="Schedule Stages"
                items={scheduleStages}
                variant="underlined" // 改为下划线风格更简洁
                color="primary"
                className="w-full" // 确保外层占满
                classNames={{
                    // 核心修改在这里：
                    tabList: [
                        "gap-6 relative rounded-none p-0 border-b border-divider", // 基础样式
                        "w-full overflow-x-auto scrollbar-hide",                 // 滚动逻辑
                        "flex justify-start px-6",                               // 手机端：靠左 + 左右留空隙
                        "md:justify-center md:px-0"                              // 电脑端：居中 + 去除多余空隙
                    ].join(" "),

                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "text-default-600 group-data-[selected=true]:text-primary group-data-[selected=true]:font-bold text-lg",
                    panel: "w-full py-4",
                }}
                defaultSelectedKey={searchParams.get('stage') || tabs.at(-1)?.stage_name}
                onSelectionChange={(key) => router.replace(`?stage=${key}`)}
            >
                {(schedule_stage) => (
                    <Tab key={schedule_stage.stage_name} title={schedule_stage.stage_name}>
                        <div className="w-full max-w-5xl mx-auto">
                            {schedule_stage.is_lobby ?
                                <GroupComp schedule={schedule_stage} tournament_name={tournament_name}
                                           tournamentPlayers={tournamentPlayers} setSchedule={setScheduleStages}/> :
                                <TeamComp schedule={schedule_stage} tournament_name={tournament_name}
                                          tournament_players={tournamentPlayers} setSchedule={setScheduleStages}/>
                            }
                        </div>
                    </Tab>
                )}
            </Tabs>
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
    const BracketHeader = ({ title, color }: { title: string, color: "success" | "danger" | "primary" }) => (
        <div className="flex items-center gap-4 my-4">
            <Chip color={color} variant="flat" size="lg" className="font-bold min-w-fit">
                {title}
            </Chip>
            <Divider className="flex-1" />
        </div>
    );
    const accordionStyle = {
        // base 是每一行的容器
        // 添加: border border-transparent (预留边框位置防止跳动)
        // 添加: hover:border-primary/50 (鼠标移上去变蓝)
        // 调整: transition-all duration-300 (平滑过渡)
        base: "group-[.is-splitted]:px-0 group-[.is-splitted]:bg-content1 group-[.is-splitted]:shadow-sm hover:group-[.is-splitted]:bg-content2 border border-default-100/50 hover:border-primary/50 transition-all duration-300 my-2",
        title: "text-default-500",
        trigger: "py-1", // 稍微减小内边距让整体紧凑一点
        content: "pt-0 pb-4 px-4",
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <BracketHeader title="胜者组 / Winner Bracket" color="success" />
                <Accordion
                    variant="splitted"
                    itemClasses={accordionStyle}
                >
                    {(schedule.match_info || []).filter((match) => match.is_winner_bracket).map((match_info, index) => (
                        <AccordionItem
                            key={index}
                            title={<VSInfoComp match_info={match_info}/>}
                            textValue={`${match_info.team1.name} vs ${match_info.team2.name}`}
                        >
                            <MatchInfoComp match_info={match_info} stage_name={schedule.stage_name}
                                           tournament_name={tournament_name} tournament_players={tournament_players}
                                           setSchedule={setSchedule}/>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            {schedule.match_info?.some((match) => !match.is_winner_bracket) && (
                <div>
                    <BracketHeader title="败者组 / Loser Bracket" color="danger" />
                    <Accordion variant="splitted" itemClasses={accordionStyle}>
                        {(schedule.match_info || []).filter((match) => !match.is_winner_bracket).map((match_info, index) => (
                            <AccordionItem
                                key={index}
                                title={<VSInfoComp match_info={match_info}/>}
                                textValue={`${match_info.team1.name} vs ${match_info.team2.name}`}
                            >
                                <MatchInfoComp match_info={match_info} stage_name={schedule.stage_name}
                                               tournament_name={tournament_name} tournament_players={tournament_players}
                                               setSchedule={setSchedule}/>
                            </AccordionItem>
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
                    <Chip size="sm" variant="flat" color="primary" className="mb-1 border-none">
                        {dateStr}
                    </Chip>
                    <span className="text-xl font-mono  text-default-700 leading-none">
                        {timeStr}
                    </span>
                </div>

                {/* 移动端的时间显示 (仅在小屏幕显示) */}
                <div className="flex md:hidden items-center justify-center w-full px-2 mb-2 gap-2">
                    <div className="flex gap-2 items-center">
                        <Chip size="sm" variant="flat" color="primary">{dateStr}</Chip>
                        <span className="text-lg font-mono  text-default-700">{timeStr}</span>
                    </div>
                    {/* 移动端把链接放这里 */}
                    <div className="flex gap-2">
                         {match_info.match_url?.filter(u => u !== "").map((url, i) => (
                            <Button key={i} className="bg-primary/20 text-primary" isExternal isIconOnly size="sm" variant="light" as={Link} href={url}>
                                <LinkIcon className="text-primary w-4 h-4" />
                            </Button>
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

                    <Image
                        radius="md"
                        alt={match_info.team1.name}
                        className="w-10 h-10 md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-content2"
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
                    <Image
                        radius="md"
                        alt={match_info.team2.name}
                        className="w-10 h-10 md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-content2"
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
                            <Button key={i} isExternal isIconOnly size="sm" variant="flat" color="primary"
                                    className="bg-primary/20 text-primary"
                                    aria-label="Match-Link" as={Link} href={url}>
                                <LinkIcon className="text-primary w-4 h-4" />
                            </Button>
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
    const InfoSection = ({ title, role, list, canJoin }: any) => (
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
                <InfoSection title="裁判" role="referee" list={match_info.referee} canJoin={info?.referee} />
                <InfoSection title="直播" role="streamer" list={match_info.streamer} canJoin={info?.streamer} />
                <InfoSection title="解说" role="commentator" list={match_info.commentators} canJoin={info?.commentator} />
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-3 min-w-0">
                    <Chip color="primary" variant="flat" className="self-center">{match_info.team1.name} 热手图</Chip>
                    <div className="w-full">
                        {match_info.team1_warmup ?
                            <MapComp map={match_info.team1_warmup}/> :
                            <div className="text-center text-default-400 py-4">暂无热手图</div>
                        }
                    </div>
                    <WarmupSelect uid={match_info.team1.uid} team={1} match_id={match_info.match_id} stage_name={stage_name} tournament_name={tournament_name} start_time={match_info.datetime}/>
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                    <Chip color="danger" variant="flat" className="self-center">{match_info.team2.name} 热手图</Chip>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.lobby_info?.map((lobby) => {
                 const date = new Date(lobby.datetime);
                 const canJoinPlayer = info?.player && !isPlayerReserved(playerUID, schedule) && !(lobby.participants?.some((p) => playerUID && p.uid.includes(playerUID)));
                 const canJoinRef = info?.referee && !(lobby.referee?.some((r) => playerUID && r.uid.includes(playerUID)));
                 const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
                 const timeStr = `${formatTime(date.getUTCHours().toString())}:${formatTime(date.getUTCMinutes().toString())}`;
                 return (
                    <Card
    key={lobby.lobby_name}
    className="border border-default-200/50 bg-content1/50 hover:bg-content1 hover:border-primary/50 transition-all duration-300"
>
                        <CardHeader className="flex justify-between items-center pb-3 pt-4 px-4">
                            <div className="flex gap-4 items-center">
                                <div className="flex flex-col items-center justify-center min-w-[60px]">
                                    <Chip size="sm" variant="flat" color="primary" className="mb-1 border-none">
                                        {dateStr}
                                    </Chip>
                                    <span className="text-xl font-mono text-default-600 leading-none">
                                        {timeStr}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-bold text-lg leading-none">{lobby.lobby_name}</h3>
                                    <span className="text-xs text-default-400 mt-1">Lobby ID: {lobby.match_id}</span>
                                </div>
                            </div>
                            {lobby.match_url && lobby.match_url.length > 0 && (
                                <Button className="bg-primary/20 text-primary" isExternal isIconOnly size="sm" variant="light" as={Link} href={lobby.match_url[0]}>
                                    <LinkIcon className="text-primary w-4 h-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-default-500 uppercase">裁判</span>
                                    <Chip size="sm" variant="flat">{lobby.referee?.length || 0}</Chip>
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
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-default-500 uppercase">选手</span>
                                    <Chip size="sm" variant="flat" color={lobby.participants?.length === 16 ? "danger" : "default"}>
                                        {lobby.participants?.length || 0} / 16
                                    </Chip>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto scrollbar-hide">
                                    {lobby.participants?.map((p) => (
                                        (playerUID && p.uid.includes(playerUID)) ?
                                            <WithDeletePersonInfo key={p.name} tournament_name={tournament_name} stage_name={schedule.stage_name} info={p} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/> :
                                            <PersonInfo key={p.name} info={p}/>
                                    ))}
                                    {canJoinPlayer && <ParticipantJoinHere tournament_name={tournament_name} stage_name={schedule.stage_name} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/>}
                                </div>
                            </div>
                        </CardBody>
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
        <Link isExternal href={`https://osu.ppy.sh/users/${info.uid[0]}`} className="group">
            <Chip
                variant="flat"
                avatar={
                    <Image
                        src={info.avatar_url || "https://a.ppy.sh"}
                        alt={info.name}
                        className="rounded-full w-full h-full object-cover" // 确保图片填充
                    />
                }
                classNames={{ base: "pl-1 hover:bg-default-200 transition-colors cursor-pointer" }}
            >
                {info.name}
            </Chip>
        </Link>
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
    return (
        <Link color={"foreground"}
              className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2 max-w-lg cursor-pointer"}>
            <Image radius={"none"} alt="icon" className={"h-[40px] w-[40px] min-w-[40px]"}
                   src={info.avatar_url || "https://a.ppy.sh"}/>
            <div className={"truncate"}>
                {info.name}
            </div>
            <div className={"h-[40px] w-[40px] min-w-[40px] flex items-center justify-center text-3xl absolute right-0"}
                 onClick={async () => {
                     const res = await fetch(siteConfig.backend_url + `/api/sign-out-match?tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${lobbyInfo.match_id}&role=${role}`, {credentials: 'include'})
                     if (res.status != 200) {
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
                         alert("取消报名成功")
                     }
                 }}>
                {"×"}
            </div>
        </Link>
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
            variant="solid"
            color="primary"
            className="h-6 min-h-6 px-2 border-1"
            onPress={async () => {
                  const res = await fetch(siteConfig.backend_url + `/api/signup-match?tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${lobbyInfo.match_id}&role=${role}`, {credentials: 'include'})
                   if (res.status != 200) {
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
        <Card className="w-full h-[120px] shadow-sm group">
            <Image
                removeWrapper
                alt="Beatmap Cover"
                className="z-0 w-full h-full object-cover absolute top-0 left-0 brightness-[0.6] group-hover:scale-105 transition-transform duration-500" // 稍微调亮一点 brightness，因为我们要加渐变层了；增加 scale 动效
                src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
            />

            {/* 渐变遮罩层：从底部黑色渐变到顶部透明 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

            {/* 内容层 z-20 确保在渐变之上 */}
            <div className="z-20 relative h-full flex flex-col justify-between p-3 text-white">
                <div className="flex flex-col gap-0.5">
                    <Link isExternal href={`https://osu.ppy.sh/b/${map.map_id}`} className="text-white hover:text-primary transition-colors">
                        <h4 className="font-bold text-lg line-clamp-1 leading-tight" title={map.map_name}>
                            {map.map_name}
                        </h4>
                    </Link>
                    <div className="flex gap-2 items-center text-xs text-white/80">
                        <span className="bg-white/20 px-1 rounded">[{map.diff_name}]</span>
                        <span>by {map.mapper}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="grid grid-cols-4 gap-x-3 gap-y-0 text-xs font-mono text-white/90">
                        <span>CS: {map.cs}</span>
                        <span>AR: {map.ar}</span>
                        <span>OD: {map.od}</span>
                        <span>HP: {map.hp}</span>
                    </div>

                    <div className="flex flex-col items-end gap-0">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                            <span>★</span> {map.star_rating}
                        </div>
                        <div className="text-xs text-white/60">
                            {map.bpm} BPM
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}


const WarmupSelect = ({uid, team, tournament_name, stage_name, match_id, start_time}: any) => {
    const [map_id, setMapId] = useState("");
    const currentUser = useContext(CurrentUserContext);
    if (!uid.includes(currentUser?.currentUser?.uid) || new Date(start_time) < new Date()) {
        return null
    }
    return (
        <div className="flex flex-row gap-2 items-end w-full mt-2">
            <Input
                size="sm"
                labelPlacement="outside"
                placeholder="Beatmap ID (e.g. 123456)"
                label="Change Warmup"
                value={map_id}
                onChange={(e) => setMapId(e.target.value)}
                className="flex-grow"
            />
            <Button size="sm" color="primary" onPress={async () => {
                // ... 逻辑保持不变 ...
                 if (map_id == "" || isNaN(parseInt(map_id))) {
                    alert("请输入正确的map id")
                }
                const res = await fetch(siteConfig.backend_url + `/api/update-warmup?map_id=${map_id}&team=${team}&tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${match_id}`, {credentials: 'include'})
                if (res.status != 200) {
                    alert(await res.text());
                    return;
                }
                alert('更新成功 请等待服务器更新后 刷新页面查看');
            }}>
                Submit
            </Button>
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