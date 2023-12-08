"use client"

import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import {Tab, Tabs} from "@nextui-org/tabs";
import {Image} from "@nextui-org/image";
import {Link} from "@nextui-org/link";
import {Divider} from "@nextui-org/divider";


export const ScheduleComp = ({tabs} : { tabs: ScheduleStage[] }) => {
    return (
        <Tabs aria-label="Dynamic tabs" items={tabs} className={"flex justify-center"} size={"lg"} classNames={{
            tabList: "gap-6 flex",
            tab: "min-w-[100px] min-h-[50px]",
            tabContent: "text-3xl",
        }}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name}>
                    <div className="grid grid-cols-3 gap-2">
                        {item.group_info?.map((stage_schedule) => (
                            <Card key={stage_schedule.group_name} className={"p-3 gap-3"}>
                                <div className={"flex flex-row items-center gap-3"}>
                                    <div className={"text-center font-bold text-2xl"}>
                                        {stage_schedule.date}
                                    </div>
                                    <div className={"text-center"}>
                                        {stage_schedule.time}
                                    </div>
                                    <div className={"font-bold text-3xl"}>
                                        {stage_schedule.group_name}
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
                </Tab>
                        )}
        </Tabs>
    )
}

const PersonInfo = ({ info }: { info: SimpleInfo }) => {
    return (
        <div  className={"flex flex-row justify-start items-center border-2 p-0.5 gap-2"}>
            <Image radius={"none"} className={"h-[40px] w-[40px] min-w-[40px]"} src={info.avatar_url}/>
            <Link color={"foreground"} href={info.uid? `https://osu.ppy.sh/users/${info.uid}` : undefined} className={"truncate"}>
                {info.name}
            </Link>
        </div>
    )
}


export interface ScheduleStage{
    stage_name: string;
    is_group: boolean;
    group_info?: {
        group_name: string;
        time: string;
        date: string;
        match_url?: string;
        referee?: SimpleInfo[];
        participants?: SimpleInfo[];
    }[]
    match_info?:{
        match_name: string;
        time: string;
        date: string;
        match_url?: string;
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

