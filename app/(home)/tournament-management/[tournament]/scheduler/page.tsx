"use client";

import {Select, SelectItem} from "@nextui-org/select";
import React, {useContext, useEffect, useState} from "react";
import {getRoundInfo, TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {Button} from "@nextui-org/button";
import {Input} from "@nextui-org/input";
import {Autocomplete, AutocompleteItem} from "@nextui-org/autocomplete";
import {Avatar} from "@nextui-org/avatar";
import {getTournamentMembers, TournamentMember} from "@/app/(home)/tournament-management/[tournament]/member/page";
import {Divider} from "@nextui-org/divider";
import {useFilter} from "@react-aria/i18n";
import {Switch} from "@nextui-org/switch";

export default function SchedulerPage({params}: { params: { tournament: string } }) {
    const currentUser = useContext(CurrentUserContext);
    const [round, setRound] = useState<Set<string>>(new Set([]));
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<Schedule[]>([]);
    const [members, setMembers] = useState<TournamentMember[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getRoundInfo(params.tournament);
                setRoundInfo(data);
                const data1 = await getSchedule(params.tournament);
                setScheduleInfo(data1);
                const data2 = await getTournamentMembers(params.tournament);
                const filteredData = [...data2].filter((member) => member.player);
                setMembers(filteredData);
            }
        };
        fetchData();
    }, [currentUser]);
    console.log(scheduleInfo)

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold">
                赛程管理
            </h1>
            <Select
                label="选择比赛轮次"
                className="max-w-xs"
                description="若没有所需比赛轮次，请主办先在轮次管理中添加比赛轮次"
                selectedKeys={round}
                // @ts-ignore
                onSelectionChange={setRound}
            >
                {roundInfo.map((round) => (
                    <SelectItem key={round.stage_name} value={round.stage_name}>
                        {round.stage_name}
                    </SelectItem>
                ))}
            </Select>
            <Button color="primary" className="max-w-fit">
                添加新赛程
            </Button>
            {
                scheduleInfo.map((schedule, index) => {
                if (schedule.stage_name === Array.from(round)[0]) {
                    return (
                        <>
                            <div key={index} className="flex flex-col gap-5">
                                {
                                    schedule.is_lobby ?
                                        (
                                            <div>
                                            </div>
                                        ) :
                                        (
                                            <div className="flex flex-col gap-5">
                                                <div className="flex flex-row gap-5 items-baseline">
                                                    <Input className="max-w-[80px]" label="比赛序号" value={schedule.match_id}
                                                           description="不能重复" onChange={(e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            newScheduleInfo[index].match_id = e.target.value;
                                                        }}
                                                    />
                                                    <MemberSelect members={members} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} team="team1" index={index} />
                                                    <MemberSelect members={members} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} team="team2" index={index} />
                                                    <Input type="date" label="日期" isRequired placeholder="Enter your email" />
                                                    <Input type="time" label="时间" isRequired placeholder="Enter your email" />
                                                    <Switch defaultSelected={schedule.is_winner_bracket} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            newScheduleInfo[index].is_winner_bracket = e.target.checked;
                                                            setScheduleInfo(newScheduleInfo);
                                                        }
                                                    }>
                                                        是否为胜者组
                                                    </Switch>
                                                </div>
                                            </div>
                                        )
                                }

                            </div>
                            <Divider/>
                        </>
                    )
                }
                }
            )}
        </div>
    )
}


const MemberSelect = ({members, scheduleInfo, setScheduleInfo, team, index}:
                          {
                              members: TournamentMember[],
                              scheduleInfo: Schedule[],
                              setScheduleInfo:  React.Dispatch<React.SetStateAction<Schedule[]>>,
                              team: "team1" | "team2",
                              index: number
                          }) => {
    const [fieldState, setFieldState] = React.useState<{selectedKey: string | null, inputValue: string, items: TournamentMember[]}>({
        selectedKey: members.find((member) => member.uid === (team === "team1"? scheduleInfo[index].team1.toString(): scheduleInfo[index].team2.toString()))?.name || "",
        inputValue: members.find((member) => member.uid === (team === "team1"? scheduleInfo[index].team1.toString(): scheduleInfo[index].team2.toString()))?.name || "",
        items: members,
    });
    let { contains } = useFilter({
        sensitivity: 'base'
    });
    const onInputChange = (value: string) => {
        setFieldState((prevState) => ({
            inputValue: value,
            selectedKey: value === "" ? null : prevState.selectedKey,
            items: members.filter((item) => contains(item.uid + item.name, value)),
        }));
    };
    const onSelectionChange = (key: string | null) => {
        let newScheduleInfo = [...scheduleInfo];
        if (!newScheduleInfo[index].is_lobby) {
            team === "team1" ? newScheduleInfo[index].team1 = key || "" : newScheduleInfo[index].team2 = key || "";
            setScheduleInfo(newScheduleInfo);
        }
        setFieldState((prevState) => {
            let selectedItem = prevState.items.find((option) => option.uid === key);
            return {
                inputValue: selectedItem?.name || "",
                selectedKey: key? key : "",
                items: members.filter((item) => contains(item.uid + item.name, selectedItem?.uid || "")),
            };
        });
    };
    const onOpenChange = () => {
        setFieldState((prevState) => ({
            inputValue: fieldState.inputValue,
            selectedKey: prevState.selectedKey,
            items: members.filter((item) => contains(item.uid + item.name, fieldState.inputValue || "")),
        }));
    };
    return (
        <Autocomplete
            label={team === "team1"? "队伍1": "队伍2"}
            className="max-w-xs"
            inputValue={fieldState.inputValue}
            items={fieldState.items}
            selectedKey={fieldState.selectedKey}
            // @ts-ignore
            onKeyDown={(e) => e.continuePropagation()}
            onInputChange={onInputChange}
            onOpenChange={onOpenChange}
            // @ts-ignore
            onSelectionChange={onSelectionChange}
        >
            {(member) => (
                <AutocompleteItem key={member.uid} textValue={member.name}>
                    <div className="flex gap-2 items-center">
                        <Avatar alt={member.name} className="flex-shrink-0" size="sm" src={`https://a.ppy.sh/${member.uid}`} />
                        <div className="flex flex-col">
                            <span className="text-small">{member.name}</span>
                            <span className="text-tiny text-default-400">{member.uid}</span>
                        </div>
                    </div>
                </AutocompleteItem>
            )}
        </Autocomplete>
    )
}


async function getSchedule(tournament_name: string): Promise<Schedule[]> {
    const res = await fetch(`http://localhost:8421/api/get-schedule?tournament_name=${tournament_name}`);
    if (!res.ok) {
        throw new Error(res.statusText);
    }
    return await res.json();
}

interface Schedule {
    tournament_name: string;
    stage_name: string;
    match_id: string;
    is_lobby: boolean;
    is_winner_bracket: boolean;
    name?: string;
    match_time?: string;
    match_url?: string;
    referee?: number[];
    streamer?: number[];
    commentators?: number[];
    participants?: number[];
    team1: string;
    team2: string;
    team1_score?: number;
    team2_score?: number;
    team1_warmup: number;
    team2_warmup: number;
}
