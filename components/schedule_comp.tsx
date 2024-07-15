"use client"

import {Card, CardFooter, CardHeader} from "@nextui-org/card";
import {Tab, Tabs} from "@nextui-org/tabs";
import {Image} from "@nextui-org/image";
import {Link} from "@nextui-org/link";
import {Divider} from "@nextui-org/divider";
import {Accordion, AccordionItem} from "@nextui-org/accordion";
import {Dispatch, SetStateAction, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import {siteConfig} from "@/config/site";
import {LinkIcon} from "@/components/icons";
import {useRouter, useSearchParams} from "next/navigation";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";


async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: revalidate_time }})
    return await res.json()
}

function isPlayerReserved(playerUID: number|undefined, schedule_stage: ScheduleStage): boolean {
    if (!playerUID) return false;
    if (!schedule_stage.lobby_info) return false;
    return schedule_stage.lobby_info.some((stage_schedule) => (stage_schedule.participants?.some((info) => info.uid.includes(playerUID)) ));
}


export const ScheduleComp = ({tabs, tournament_name} : { tabs: ScheduleStage[], tournament_name: string }) => {
    const currentUser = useContext(CurrentUserContext);
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({players: []});
    const players = tournamentPlayers.players.filter(player => player.player == true);
    const referees = tournamentPlayers.players.filter(player => player.referee == true);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getPlayers(tournament_name);
                setTournamentPlayers(data);
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const playerUID = currentUser?.currentUser?.uid;
    const isParticipant = players.some((player) => player.uid === playerUID);
    const isReferee = referees.some((referee) => referee.uid === playerUID);

    const searchParams = useSearchParams()
    const router = useRouter()
    return (
        <Tabs aria-label="Dynamic tabs" items={tabs} className={"flex justify-center"} size={"lg"}  defaultSelectedKey={searchParams.get('stage') || tabs.at(-1)?.stage_name}
              onSelectionChange={(key) => {router.replace(`?stage=${key}`)}}
              classNames={{
                  tabList: "gap-6 flex",
                  tab: "min-h-[50px]",
                  tabContent: "text-3xl",
              }}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name}>
                    {
                        item.is_lobby ? <GroupComp schedule_stage={item} tournament_name={tournament_name} userInfo={{uid: playerUID, isParticipant: isParticipant, isReferee: isReferee}}/> : <TeamComp schedule_stage={item} tournament_name={tournament_name} />
                    }
                </Tab>
            )}
        </Tabs>
    )
}
const TeamComp = ({schedule_stage, tournament_name}: { schedule_stage: ScheduleStage, tournament_name: string }) => {
    if (schedule_stage.match_info == undefined) {
        return null
    }
    return (

        <div className={"flex flex-col gap-3"}>
            <div className={"flex flex-row gap-3 max-w-full"}>
                <p className={"text-2xl min-w-fit"}>
                    胜者组
                </p>
                <Divider className={"mt-4 shrink"} />
            </div>
            <Accordion variant="bordered">
                {schedule_stage.match_info.filter((match) => match.is_winner_bracket).map((match_info, index) => (
                    <AccordionItem key={index} title={<VSInfoComp match_info={match_info} />} textValue={`${match_info.team1} vs ${match_info.team2}`}>
                        <MatchInfoComp match_info={match_info} stage_name={schedule_stage.stage_name} tournament_name={tournament_name} />
                    </AccordionItem>
                ))}
            </Accordion>
            <div className={"flex flex-row gap-3"}>
                <p className={"text-2xl min-w-fit"}>
                    败者组
                </p>
                <Divider className={"mt-4 shrink"} />
            </div>
            <Accordion variant="bordered">
                {schedule_stage.match_info.filter((match) => !match.is_winner_bracket).map((match_info, index) => (
                    <AccordionItem key={index} title={<VSInfoComp match_info={match_info} />} textValue={`${match_info.team1} vs ${match_info.team2}`}>
                        <MatchInfoComp match_info={match_info} stage_name={schedule_stage.stage_name} tournament_name={tournament_name} />
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}


const MatchInfoComp = ({match_info, stage_name, tournament_name}: { match_info: MatchInfo, stage_name: string, tournament_name: string}) => {
    return (
        <div className={"flex flex-col gap-4"}>
            <Divider/>
            <div className={"grid grid-cols-1 sm:grid-cols-3 gap-4"}>
                <div className={"flex flex-col"}>
                    {match_info.referee ? (
                        <>
                            <div className={"text-center text-xl"}>
                                裁判
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {match_info.referee?.map((referee, n) => (
                                    <AnotherPersonInfo key={n} info={referee}/>
                                ))}
                            </div>
                        </>
                    ) : ''}
                </div>
                <div className={"flex flex-col"}>
                    {match_info.streamer ? (
                        <>
                            <div className={"text-center text-xl"}>
                                直播
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {match_info.streamer?.map((streamer, n) => (
                                    <AnotherPersonInfo key={n} info={streamer}/>
                                ))}
                            </div>
                        </>) : ''}
                </div>
                <div className={"flex flex-col"}>
                    {match_info.commentators ? (
                        <>
                            <div className={"text-center text-xl"}>
                                解说
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {match_info.commentators?.map((commentator, n) => (
                                    <AnotherPersonInfo key={n} info={commentator}/>
                                ))}
                            </div>
                        </>) : ''}
                </div>
            </div>
            <Divider/>
            <div className={"grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                <div className={"flex flex-col items-center gap-3"}>
                    <div className={"text-center text-xl"}>
                        {match_info.team1.name} 热手
                    </div>
                    {match_info.team1_warmup?
                        <MapComp map={match_info.team1_warmup}/>
                        : "暂无热手图"
                    }
                    <WarmupSelect uid={match_info.team1.uid} team={1} match_id={match_info.match_id} stage_name={stage_name} tournament_name={tournament_name} start_time={match_info.datetime} />
                </div>
                <div className={"flex flex-col items-center gap-3"}>
                    <div className={"text-center text-xl"}>
                        {match_info.team2.name} 热手
                    </div>
                    {match_info.team2_warmup?
                        <MapComp map={match_info.team2_warmup}/>
                        : "暂无热手图"
                    }
                    <WarmupSelect uid={match_info.team2.uid} team={2} match_id={match_info.match_id} stage_name={stage_name} tournament_name={tournament_name} start_time={match_info.datetime} />
                </div>
            </div>
        </div>
    )
}


const WarmupSelect = ({uid, team, tournament_name, stage_name, match_id, start_time}: {uid: number[], team: number, tournament_name: string, stage_name: string, match_id: string, start_time: string}) => {
    const [map_id, setMapId] = useState("");
    const currentUser = useContext(CurrentUserContext);
    if (!uid.includes(currentUser?.currentUser?.uid as number) || new Date(start_time) < new Date()) {
        return null
    }
    return (
        <div className="flex flex-row gap-3 items-baseline grow">
            <Input className="" label="map id" onChange={(e) => {setMapId(e.target.value)}} description="你可以在比赛开始前在这里添加或修改你的热手图" />
            <Button color="primary" onPress={async () => {
                if (map_id == "" || isNaN(parseInt(map_id))) {
                    alert("请输入正确的map id")
                }
                const res = await fetch(siteConfig.backend_url + `/api/update-warmup?map_id=${map_id}&team=${team}&tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${match_id}`, {credentials: 'include'})
                if (res.status != 200) {
                    alert(await res.text());
                    return;
                }
                alert('更新成功 请等待服务器更新后 刷新页面查看');
            }}> 提交 </Button>
        </div>
    )

}


const VSInfoComp = ({match_info}: { match_info: MatchInfo }) => {
    const score1 = match_info.team1_score ? match_info.team1_score : 0
    const score2 = match_info.team2_score ? match_info.team2_score : 0
    const text_color1 = score1 >= score2 ? "" : "text-neutral-500"
    const text_color2 = score1 <= score2 ? "" : "text-neutral-500"
    const pic_color1 = score1 >= score2 ? "" : "brightness-50"
    const pic_color2 = score1 <= score2 ? "" : "brightness-50"

    return (
        <div className={"grid grid-cols-1 sm:flex sm:flex-wrap gap-3 grow items-center justify-center justify-items-center"}>
            <div className={"w-[56px] text-start font-bold text-2xl"}>
                {(new Date(match_info.datetime)).getUTCMonth() + 1}/{(new Date(match_info.datetime)).getUTCDate()}
            </div>
            <div className={"text-center"}>
                {formatTime(((new Date(match_info.datetime)).getUTCHours()).toString())}:{formatTime(((new Date(match_info.datetime)).getUTCMinutes()).toString())}
            </div>
            <div className={"grid grid-cols-1 sm:flex sm:flex-row sm:flex-wrap justify-center grow items-center justify-items-center gap-3"}>
                <div className="flex flex-row items-center gap-4 grow max-w-[200px] sm:justify-end justify-center">
                    <div className={"text-right " + text_color1}>
                        {match_info.team1.name}
                    </div>
                    <Image loading={"lazy"} radius={"sm"} alt="icon" className={"h-[40px] w-[40px] min-w-[40px] " + pic_color1} src={match_info.team1.avatar_url || "https://a.ppy.sh"} />
                </div>
                <div className={"w-[60px] min-w-[60px] text-center"}>
                    {`${score1} : ${score2}`}
                </div>
                <div className="flex flex-row items-center gap-4 grow max-w-[200px] sm:justify-start justify-center">
                    <Image loading={"lazy"} radius={"sm"} alt="icon" className={"h-[40px] w-[40px] min-w-[40px] " + pic_color2} src={match_info.team2.avatar_url || "https://a.ppy.sh"} />
                    <div className={" " + text_color2}>
                        {match_info.team2.name}
                    </div>
                </div>
            </div>
            <div className={"lg:w-[75px]"}>
                {
                    match_info.match_url && match_info.match_url.length > 0 ?
                        match_info.match_url.map((url) => (
                            url !== "" ?
                                <Button key={url} isExternal isIconOnly className="bg-sky-500" aria-label="Match-Link" as={Link} href={url}>
                                    <LinkIcon/>
                                </Button> : null
                        )) : null
                }
            </div>

        </div>
    )
}
const MapComp = ({map}: { map: map }) => {
    return (
        <Card key={map.map_id} className={"min-w-full"}>
            <CardHeader className="absolute z-10 top-0 flex-col items-center">
                <Link isExternal size={"lg"} color={"foreground"}
                      className="line-clamp-1 font-bold leading-5 text-center"
                      href={`https://osu.ppy.sh/b/${map.map_id}`}>
                    <p className="line-clamp-1">
                        {map.map_name} [{map.diff_name}]
                    </p>
                </Link>
                <Link isExternal color={"foreground"} className=""
                      href={`https://osu.ppy.sh/users/${map.mapper}`}>
                    {map.mapper}
                </Link>
                <div className="grid grid-cols-3 place-items-center w-full mt-4">
                    <div className="line-clamp-1">
                        ★{map.star_rating}
                    </div>
                    <div className="line-clamp-1">
                        bpm {map.bpm}
                    </div>
                    <div className="line-clamp-1">
                        {map.length}
                    </div>
                </div>
                <div className="grid grid-cols-4 place-items-center w-full">
                    <div className="line-clamp-1">
                        CS {map.cs}
                    </div>
                    <div className="line-clamp-1">
                        HP {map.hp}
                    </div>
                    <div className="line-clamp-1">
                        OD {map.od}
                    </div>
                    <div className="line-clamp-1">
                        AR {map.ar}
                    </div>
                </div>
            </CardHeader>
            <Image
                removeWrapper
                className="z-0 w-full h-[130px] object-cover dark:brightness-50"
                alt="Card background"
                width="100%"
                src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}/>
            <CardFooter className="absolute z-10 bottom-0 grid grid-rows-2">
            </CardFooter>
        </Card>
    )
}

const GroupComp = ({schedule_stage, tournament_name, userInfo}: { schedule_stage: ScheduleStage, tournament_name:string, userInfo: UserInfo }) => {
    const [schedule, setSchedule] = useState<ScheduleStage>(schedule_stage)
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ">
            {schedule.lobby_info?.map((lobby, index) => (
                <Card key={lobby.lobby_name} className={"p-3 gap-3"}>
                    <div className={"flex flex-row items-center gap-3"}>
                        <div className="w-[80px]">
                            <div className={"text-center font-bold text-2xl"}>
                                {(new Date(lobby.datetime)).getUTCMonth() + 1}/{(new Date(lobby.datetime)).getUTCDate()}
                            </div>
                            <div className={"text-center"}>
                                {formatTime(((new Date(lobby.datetime)).getUTCHours()).toString())}:{formatTime(((new Date(lobby.datetime)).getUTCMinutes()).toString())}
                            </div>
                        </div>
                        <div className={"grow font-bold text-3xl text-center"}>
                            {lobby.lobby_name}
                        </div>
                        <div className="w-[80px]"/>
                    </div>
                    <Divider/>
                    <div className={"text-center text-xl"}>
                        裁判
                    </div>
                    <div className={"grid grid-cols-1 sm:grid-cols-2 gap-2"}>
                        {lobby.referee?.map((referee) => (
                            (userInfo.uid && referee.uid.includes(userInfo.uid)) ? <WithDeletePersonInfo key={referee.name} tournament_name={tournament_name} stage_name={schedule.stage_name} info={referee} lobbyInfo={lobby} role="referee" setSchedule={setSchedule}/> : <PersonInfo key={referee.name} info={referee}/>
                        ))}
                        {userInfo.isReferee && !(lobby.referee?.some((referee) => userInfo.uid && referee.uid.includes(userInfo.uid))) && <ParticipantJoinHere tournament_name={tournament_name} stage_name={schedule.stage_name} lobbyInfo={lobby} role="referee" setSchedule={setSchedule}/>}
                    </div>
                    <Divider/>
                    <div className={"text-center text-xl"}>
                        选手
                    </div>
                    <div className={"grid grid-cols-1 sm:grid-cols-2 gap-2"}>
                        {lobby.participants?.map((participants) => (
                            (userInfo.uid && participants.uid.includes(userInfo.uid)) ? <WithDeletePersonInfo key={participants.name} tournament_name={tournament_name} stage_name={schedule.stage_name} info={participants} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/> : <PersonInfo key={participants.name} info={participants}/>
                        ))}
                        {userInfo.isParticipant && !isPlayerReserved(userInfo.uid, schedule) && !(lobby.participants?.some((participants) => userInfo.uid && participants.uid.includes(userInfo.uid))) && <ParticipantJoinHere tournament_name={tournament_name} stage_name={schedule.stage_name} lobbyInfo={lobby} role="player" setSchedule={setSchedule}/>}
                    </div>
                </Card>
            ))}
        </div>
    )
}

const AnotherPersonInfo = ({ info }: { info: SimpleInfo }) => {
    return (
        <Link isExternal color={"foreground"} className={"grid grid-cols-1 border-2 p-2 min-w-[130px]"} key={info.name} href={`https://osu.ppy.sh/users/${info.uid[0]}`}>
            <div className="flex justify-center">
                <Image loading={"lazy"} alt="icon" width={60} height={60} src={info.avatar_url}/>
            </div>
            <div className="flex justify-center text-medium">
                {info.name}
            </div>
        </Link>
    )
}


const PersonInfo = ({ info }: { info: SimpleInfo }) => {
    return (
        <Link color={"foreground"} isExternal href={`https://osu.ppy.sh/users/${info.uid[0]}`} className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2 max-w-lg"}>
            <Image loading={"lazy"} radius={"none"} alt="icon" className={"h-[40px] w-[40px] min-w-[40px]"} src={info.avatar_url || "https://a.ppy.sh"}/>
            <div  className={"truncate"}>
                {info.name}
            </div>
        </Link>
    )
}


const WithDeletePersonInfo = ({ tournament_name, stage_name, info, lobbyInfo, role, setSchedule }: { tournament_name: string, stage_name: string, info: SimpleInfo, lobbyInfo: LobbyInfo, role: string , setSchedule: Dispatch<SetStateAction<ScheduleStage>> }) => {
    return (
        <Link color={"foreground"} className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2 max-w-lg cursor-pointer"}>
            <Image loading={"lazy"} radius={"none"} alt="icon" className={"h-[40px] w-[40px] min-w-[40px]"} src={info.avatar_url || "https://a.ppy.sh"}/>
            <div className={"truncate"}>
                {info.name}
            </div>
            <div className={"h-[40px] w-[40px] min-w-[40px] flex items-center justify-center text-3xl absolute right-0"} onClick={async () => {
                const res = await fetch(siteConfig.backend_url + `/api/sign-out-qualifier?tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${lobbyInfo.match_id}&role=${role}`, {credentials: 'include'})
                if (res.status != 200) {
                    alert(await res.text());
                }
                else {
                    setSchedule((prev) => {
                        if (prev.lobby_info) {
                            return {
                                ...prev,
                                lobby_info: prev.lobby_info.map((lobby) => {
                                    if (lobby.match_id == lobbyInfo.match_id) {
                                        if (role === "player") {
                                            return {
                                                ...lobby,
                                                participants: lobby.participants?.filter((participant) => participant.uid.some((uid) => uid != info.uid[0])) || [],
                                            }
                                        }
                                        else {
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


const ParticipantJoinHere = ({ tournament_name, stage_name, lobbyInfo, role , setSchedule }: { tournament_name: string, stage_name: string, lobbyInfo: LobbyInfo, role: string , setSchedule: Dispatch<SetStateAction<ScheduleStage>> }) => {
    return (
        <Link color={"foreground"} className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2 max-w-lg cursor-pointer border-dashed"} onPress={async () => {
            const res = await fetch(siteConfig.backend_url + `/api/signup-qualifier?tournament_name=${tournament_name}&stage_name=${stage_name}&match_id=${lobbyInfo.match_id}&role=${role}`, {credentials: 'include'})
            if (res.status != 200) {
                alert(await res.text());
            }
            else {
                const simpleInfo = await res.json()
                setSchedule((prev) => {
                    if (prev.lobby_info) {
                        return {
                            ...prev,
                            lobby_info: prev.lobby_info.map((lobby) => {
                                if (lobby.match_id == lobbyInfo.match_id) {
                                    if (role === "player") {
                                        return {
                                            ...lobby,
                                            participants: [...lobby.participants as SimpleInfo[], simpleInfo]
                                        }
                                    }
                                    else {
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
                    return prev
                })
                alert("报名成功")
            }
        }}>
            <div className={"truncate min-h-[40px] leading-[40px]"}>
                {"+加入此处"}
            </div>
        </Link>
    )
}


function formatTime(s: string) {
    if (s.length == 1) {
        return '0' + s
    }
    return s
}


export interface ScheduleStage{
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

type UserInfo = {
    uid?: number;
    isParticipant : boolean;
    isReferee: boolean;
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
