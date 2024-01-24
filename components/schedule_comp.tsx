"use client"

import { Card, CardHeader, CardFooter } from "@nextui-org/card";
import {Tab, Tabs} from "@nextui-org/tabs";
import {Image} from "@nextui-org/image";
import {Link} from "@nextui-org/link";
import {Divider} from "@nextui-org/divider";
import {Accordion, AccordionItem} from "@nextui-org/accordion";
import React from "react";


export const ScheduleComp = ({tabs} : { tabs: ScheduleStage[] }) => {
    return (
        <Tabs aria-label="Dynamic tabs" items={tabs} className={"flex justify-center"} size={"lg"} classNames={{
            tabList: "gap-6 flex",
            tab: "min-w-[100px] min-h-[50px]",
            tabContent: "text-3xl",
        }}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name}>
                    {
                        item.is_lobby ? <GroupComp schedule_stage={item}/> : <TeamComp schedule_stage={item}/>
                    }
                </Tab>
                        )}
        </Tabs>
    )
}
const TeamComp = ({schedule_stage}: { schedule_stage: ScheduleStage }) => {
    if (schedule_stage.match_info == undefined) {
        return (
        <div>
        </div>
        )

    }
    return (

        <div className={"flex flex-col gap-3"}>
            <div className={"flex flex-row gap-3"}>
                <p className={"text-2xl min-w-fit"}>
                    胜者组
                </p>
                <Divider className={"mt-4"} />
            </div>
            <Accordion variant="bordered">
                {schedule_stage.match_info.filter((match) => match.is_winner_bracket).map((match_info, index) => (
                        <AccordionItem key={index} title={<VSInfoComp match_info={match_info} />}>
                            <MatchInfoComp match_info={match_info} />
                        </AccordionItem>
                ))}
            </Accordion>
            <div className={"flex flex-row gap-3"}>
                <p className={"text-2xl min-w-fit"}>
                    败者组
                </p>
                <Divider className={"mt-4"} />
            </div>
            <Accordion variant="bordered">
                {schedule_stage.match_info.filter((match) => !match.is_winner_bracket).map((match_info, index) => (
                    <AccordionItem key={index} title={<VSInfoComp match_info={match_info} />}>
                        <MatchInfoComp match_info={match_info} />
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}


const MatchInfoComp = ({match_info}: { match_info: MatchInfo }) => {
    return (
        <div className={"flex flex-col gap-4"}>
            <Divider/>
            <div className={"grid grid-cols-3 gap-4"}>
                <div className={"flex flex-col"}>
                    <div className={"text-center text-xl"}>
                        裁判
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {match_info.referee?.map((referee, n) => (
                            <AnotherPersonInfo key={n} info={referee}/>
                        ))}
                    </div>
                </div>
                <div className={"flex flex-col"}>
                    <div className={"text-center text-xl"}>
                        直播
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {match_info.streamer?.map((streamer, n) => (
                            <AnotherPersonInfo key={n} info={streamer}/>
                        ))}
                    </div>
                </div>
                <div className={"flex flex-col"}>
                    <div className={"text-center text-xl"}>
                        解说
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {match_info.commentators?.map((commentator, n) => (
                            <AnotherPersonInfo key={n} info={commentator}/>
                        ))}
                    </div>
                </div>
            </div>
            <Divider/>
            <div className={"grid grid-cols-2 gap-3"}>
                <div className={"flex flex-col items-center gap-3"}>
                    <div className={"text-center text-xl"}>
                        {match_info.team1.name} 热手
                    </div>
                    {match_info.team1_warmup?
                        <MapComp map={match_info.team1_warmup}/>
                        : ''
                    }
                </div>
                <div className={"flex flex-col items-center gap-3"}>
                    <div className={"text-center text-xl"}>
                        {match_info.team2.name} 热手
                    </div>
                    {match_info.team2_warmup?
                        <MapComp map={match_info.team2_warmup}/>
                        : ''
                    }
                </div>
            </div>
        </div>
    )
}


const VSInfoComp = ({match_info}: { match_info: MatchInfo }) => {
    return (
        <div className={"flex gap-6 grow"}>
            <div className={"text-start font-bold text-2xl w-[72px]"}>
                {(new Date(match_info.datetime)).getUTCMonth() + 1}/{(new Date(match_info.datetime)).getUTCDate()}
            </div>
            <div className={"text-center"}>
                {formatTime(((new Date(match_info.datetime)).getUTCHours()).toString())}:{formatTime(((new Date(match_info.datetime)).getUTCMinutes()).toString())}
            </div>
            <div className={"flex flex-row justify-center gap-8 grow items-center"}>
                <div className={""}>
                    {match_info.team1.name}
                </div>
                <Image loading={"lazy"} radius={"sm"} className={"h-[40px] w-[40px] min-w-[40px]"} src={match_info.team1.avatar_url} />
                <div>
                    {`${match_info.team1_score} : ${match_info.team2_score}`}
                </div>
                <Image loading={"lazy"} radius={"sm"} className={"h-[40px] w-[40px] min-w-[40px]"} src={match_info.team2.avatar_url} />
                <div className={""}>
                    {match_info.team2.name}
                </div>
            </div>
        </div>
    )
}
const MapComp = ({map}: { map: map }) => {
    return (
        <Card key={map.map_id} className={"max-w-lg"}>
            <CardHeader className="absolute z-10 top-0 flex-col items-center">
                <Link isExternal size={"lg"} color={"foreground"}
                      className="font-bold leading-5 text-center"
                      href={`https://osu.ppy.sh/b/${map.map_id}`}>
                    {map.map_name} [{map.diff_name}]
                </Link>
                <Link isExternal color={"foreground"} className=""
                      href={`https://osu.ppy.sh/users/${map.mapper}`}>
                    {map.mapper}
                </Link>
            </CardHeader>
            <Image
                removeWrapper
                className="z-0 w-full h-[130px] object-cover dark:brightness-50"
                alt="Card background"
                width="100%"
                src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}/>
            <CardFooter className="absolute z-10 bottom-0 grid grid-rows-2">
                <div className="grid grid-cols-3 place-items-center">
                    <div>
                        ★{map.star_rating}
                    </div>
                    <div>
                        bpm {map.bpm}
                    </div>
                    <div>
                        {map.length}
                    </div>
                </div>
                <div className="grid grid-cols-4 place-items-center">
                    <div>
                        CS {map.cs}
                    </div>
                    <div>
                        HP {map.hp}
                    </div>
                    <div>
                        OD {map.od}
                    </div>
                    <div>
                        AR {map.ar}
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}

const GroupComp = ({schedule_stage}: { schedule_stage: ScheduleStage }) => {
    return (
        <div className="grid grid-cols-3 gap-2">
            {schedule_stage.lobby_info?.map((stage_schedule) => (
                <Card key={stage_schedule.lobby_name} className={"p-3 gap-3"}>
                    <div className={"flex flex-row items-center gap-3"}>
                        <div className={"text-center font-bold text-2xl"}>
                            {(new Date(stage_schedule.datetime)).getUTCMonth() + 1}/{(new Date(stage_schedule.datetime)).getUTCDate()}
                        </div>
                        <div className={"text-center"}>
                            {formatTime(((new Date(stage_schedule.datetime)).getUTCHours()).toString())}:{formatTime(((new Date(stage_schedule.datetime)).getUTCMinutes()).toString())}
                        </div>
                        <div className={"font-bold text-3xl"}>
                            {stage_schedule.lobby_name}
                        </div>
                    </div>
                    <Divider/>
                    <div className={"text-center text-xl"}>
                        裁判
                    </div>
                    <div className={"grid grid-cols-2 gap-2"}>
                        {stage_schedule.referee?.map((referee) => (
                            <PersonInfo key={referee.name} info={referee}/>
                        ))}
                    </div>
                    <Divider/>
                    <div className={"text-center text-xl"}>
                        选手
                    </div>
                    <div className={"grid grid-cols-2 gap-2"}>
                        {stage_schedule.participants?.map((participants) => (
                            <PersonInfo key={participants.name} info={participants}/>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    )
}

const AnotherPersonInfo = ({ info }: { info: SimpleInfo }) => {
    return (
        <Link isExternal color={"foreground"} className={"grid grid-cols-1 border-2 p-2 min-w-[130px]"} key={info.name} href={`https://osu.ppy.sh/users/${info.uid}`}>
            <div className="flex justify-center">
                <Image loading={"lazy"} className={""} width={60} height={60} src={info.avatar_url}/>
            </div>
            <div className="flex justify-center text-medium">
                {info.name}
            </div>
        </Link>
    )
}


const PersonInfo = ({ info }: { info: SimpleInfo }) => {
    return (
        <Link color={"foreground"} isExternal href={info.uid? `https://osu.ppy.sh/users/${info.uid}` : info.avatar_url} className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2 max-w-lg"}>
            <Image loading={"lazy"} radius={"none"} className={"h-[40px] w-[40px] min-w-[40px]"} src={info.avatar_url}/>
            <div  className={"truncate"}>
                {info.name}
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
    datetime: string;
    match_url?: string[];
    referee?: SimpleInfo[];
    participants?: SimpleInfo[];
}

export type MatchInfo = {
    datetime: string;
    is_winner_bracket: boolean;
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
    uid?: number;
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

