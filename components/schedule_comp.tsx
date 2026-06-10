"use client"

import React, {Dispatch, ReactElement, ReactNode, SetStateAction, useContext, useEffect, useRef, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {LinkIcon} from "@/components/icons"; // 假设你有这个图标，或者用 lucide-react
import {useRouter, useSearchParams} from "next/navigation";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";

const colorClass: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    secondary: "bg-primary/15 text-primary",
    success: "bg-emerald-500/15 text-emerald-300",
    danger: "bg-red-500/15 text-red-300",
    warning: "bg-amber-500/15 text-amber-300",
    default: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
};

const Card = ({children, className = "", onPress, onClick, ...props}: any) => (
    <div
        {...props}
        role={onPress ? "button" : props.role}
        tabIndex={onPress ? 0 : props.tabIndex}
        className={`relative overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-100 ${className}`}
        onClick={onPress || onClick}
        onKeyDown={(event) => {
            if (onPress && (event.key === "Enter" || event.key === " ")) onPress(event);
        }}
    >
        {children}
    </div>
);

const CardBody = ({children, className = ""}: any) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const CardHeader = ({children, className = ""}: any) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const Link = ({children, href, isExternal, className = "", ...props}: any) => (
    <a
        {...props}
        href={href}
        target={isExternal ? "_blank" : props.target}
        rel={isExternal ? "noreferrer" : props.rel}
        className={className}
    >
        {children}
    </a>
);

const Image = ({className = "", src, alt = "", removeWrapper, radius, ...props}: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
        {...props}
        src={src}
        alt={alt}
        className={`${radius === "md" ? "rounded-md" : ""} ${className}`}
    />
);

const Divider = ({className = ""}: any) => <div className={`h-px bg-zinc-200 dark:bg-white/[0.08] ${className}`}/>;

const Chip = ({children, className = "", classNames, color = "default", avatar, onClose, style}: any) => (
    <span
        className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass[color] || colorClass.default} ${classNames?.base || ""} ${className}`}
        style={style}
    >
        {avatar && <span className="h-5 w-5 overflow-hidden rounded-full">{avatar}</span>}
        <span className={classNames?.content}>{children}</span>
        {onClose && (
            <button type="button" className={classNames?.closeButton || "ml-1 rounded-full px-1 transition-all duration-150 hover:bg-white/10 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"} onClick={onClose}>
                ×
            </button>
        )}
    </span>
);

const Button = ({children, className = "", onPress, onClick, href, as, isExternal, isIconOnly, isDisabled, disabled, color = "default", ...props}: any) => {
    const classes = `${isIconOnly ? "inline-flex h-8 w-8 items-center justify-center rounded-lg p-0" : "inline-flex items-center justify-center rounded-lg px-3 py-1.5"} text-sm font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${colorClass[color] || colorClass.default} ${className}`;
    if (href || as) {
        return (
            <a
                {...props}
                href={href}
                target={isExternal ? "_blank" : props.target}
                rel={isExternal ? "noreferrer" : props.rel}
                className={classes}
                onClick={onPress || onClick}
            >
                {children}
            </a>
        );
    }
    return (
        <button {...props} type={props.type || "button"} disabled={disabled || isDisabled} className={classes} onClick={onPress || onClick}>
            {children}
        </button>
    );
};

const Input = ({label, description, className = "", value, onChange, placeholder, size}: any) => (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
        {label && <span className="font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${size === "sm" ? "h-9" : "h-10"} rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary dark:border-white/[0.08] dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600`}
        />
        {description && <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>}
    </label>
);

const Accordion = ({children, className = ""}: any) => (
    <div className={`flex flex-col gap-2 ${className}`}>{children}</div>
);

const AccordionItem = ({children, title}: any) => (
    <details className="group rounded-xl border border-zinc-200 bg-white px-4 py-2 transition-colors hover:border-primary/50 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:bg-zinc-900">
        <summary className="cursor-pointer list-none">
            {title}
        </summary>
        <div className="pt-3">{children}</div>
    </details>
);

const Tab = ({children}: { children: ReactNode; title?: ReactNode }) => <>{children}</>;

const Tabs = ({items, defaultSelectedKey, onSelectionChange, children}: any) => {
    const [selected, setSelected] = useState(String(defaultSelectedKey || items?.[0]?.stage_name || ""));
    const activeItem = items?.find((item: any) => item.stage_name === selected) || items?.[0];
    const activePanel = activeItem ? children(activeItem) as ReactElement<{ children: ReactNode }> : null;

    return (
        <div className="w-full">
            <div className="w-full border-b border-zinc-200 dark:border-white/[0.08]">
                <div className="mx-auto flex max-w-5xl justify-start gap-6 overflow-x-auto px-6 md:justify-center md:px-0">
                    {items?.map((item: any) => {
                        const active = item.stage_name === selected;
                        return (
                            <button
                                key={item.stage_name}
                                type="button"
                                className={`relative h-12 shrink-0 rounded-md px-1 text-lg font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${active ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                                onClick={() => {
                                    setSelected(item.stage_name);
                                    onSelectionChange?.(item.stage_name);
                                }}
                            >
                                {item.stage_name}
                                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"/>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="w-full py-4">{activePanel?.props.children}</div>
        </div>
    );
};


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
        base: "group-[.is-splitted]:px-0 group-[.is-splitted]:bg-surface group-[.is-splitted]:shadow-sm hover:group-[.is-splitted]:bg-surface-secondary border border-default-100/50 hover:border-primary/50 transition-all duration-300 my-2",
        title: "text-default-500",
        trigger: "py-1", // 稍微减小内边距让整体紧凑一点
        content: "pt-0 pb-4 px-4",
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                {renderBracketHeader("胜者组 / Winner Bracket", "success")}
                <Accordion
                    variant="splitted"
                    itemClasses={accordionStyle}
                >
                    {(schedule.match_info || []).filter((match) => match.is_winner_bracket).map((match_info, index) => (
                        <AccordionItem
                            key={index}
                            title={<VSInfoComp match_info={match_info}/>}
                            textValue={`${match_info.team1?.name ?? '?'} vs ${match_info.team2?.name ?? '?'}`}
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
                    {renderBracketHeader("败者组 / Loser Bracket", "danger")}
                    <Accordion variant="splitted" itemClasses={accordionStyle}>
                        {(schedule.match_info || []).filter((match) => !match.is_winner_bracket).map((match_info, index) => (
                            <AccordionItem
                                key={index}
                                title={<VSInfoComp match_info={match_info}/>}
                                textValue={`${match_info.team1?.name ?? '?'} vs ${match_info.team2?.name ?? '?'}`}
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
                        className="w-10 h-10 md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-surface-secondary"
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
                        className="w-10 h-10 md:w-12 md:h-12 min-w-[40px] md:min-w-[48px] object-cover bg-surface-secondary"
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
    className="border border-default-200/50 bg-surface/50 hover:bg-surface hover:border-primary/50 transition-all duration-300"
>
                        <CardHeader className="flex justify-between items-center py-3 px-4">
                            <h3 className="font-bold text-lg">{lobby.lobby_name}</h3>
                            <div className="flex items-center gap-2">
                                <Chip size="sm" variant="flat" color="primary" className="border-none font-mono">
                                    {dateStr} · {timeStr}
                                </Chip>
                                {lobby.match_url && lobby.match_url.filter(u => u !== "").length > 0 && (
                                    <Button className="bg-primary/20 text-primary" isExternal isIconOnly size="sm" variant="light" as={Link} href={lobby.match_url.filter(u => u !== "")[0]}>
                                        <LinkIcon className="text-primary w-4 h-4" />
                                    </Button>
                                )}
                            </div>
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
            variant="flat"
            color="primary" // 使用高亮颜色表示"这是我自己"
            onClose={handleSignOut} // HeroUI Chip 自带的关闭按钮功能
            avatar={
                <Image
                    src={info.avatar_url || "https://a.ppy.sh"}
                    alt={info.name}
                    className="rounded-full w-full h-full object-cover"
                />
            }
            classNames={{
                base: "pl-1 pr-1 h-auto py-1 gap-2 hover:bg-primary/20 transition-colors", // 调整内边距让它看起来不像默认那么挤
                content: "font-bold text-small",
                closeButton: "hover:bg-black/10 rounded-full text-lg p-0.5 active:bg-black/20 transition-colors ml-1"
            }}
        >
            {info.name}
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
            variant="solid"
            color="primary"
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

      <Image
        removeWrapper
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
          <Link
            isExternal
            href={`https://osu.ppy.sh/b/${map.map_id}`}
            className="text-white hover:text-primary transition-colors block"
          >
            <h4
              className="font-bold text-base sm:text-lg leading-tight truncate w-full drop-shadow-sm"
              title={map.map_name}
            >
              {map.map_name}
            </h4>
          </Link>

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
            <div className="flex flex-row gap-2 items-center w-full">
                <Input
                    size="sm"
                    labelPlacement="outside"
                    placeholder="Beatmap ID（例如 123456）"
                    label="更换热手图"
                    description="注意：请输入单个难度的 Beatmap ID，而非谱面集 Beatmapset ID"
                    value={map_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapId(e.target.value)}
                    className="flex-grow"
                />
                <Button size="sm" color="primary" className="mt-5" onPress={async () => {
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
