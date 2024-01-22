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
import {MenuTriggerAction} from "@react-types/combobox";
import {Chip} from "@nextui-org/chip";
import {Spinner} from "@nextui-org/spinner";

export default function SchedulerPage({params}: { params: { tournament: string } }) {
    const currentUser = useContext(CurrentUserContext);
    const [round, setRound] = useState<Set<string>>(new Set([]));
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<Schedule[]>([]);
    const [members, setMembers] = useState<TournamentMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getRoundInfo(params.tournament);
                setRoundInfo(data);
                const data1 = await getSchedule(params.tournament);
                setScheduleInfo(data1);
                const data2 = await getTournamentMembers(params.tournament);
                setMembers(data2);
            }
        };
        fetchData();
    }, [currentUser]);
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
            <Button color="primary" className="max-w-fit" onPress={()=>{
                let newScheduleInfo = [...scheduleInfo];
                newScheduleInfo.push({
                    tournament_name: params.tournament,
                    stage_name: Array.from(round)[0],
                    match_id: "",
                    is_lobby: roundInfo.find((round1) => round1.stage_name === Array.from(round)[0])?.is_lobby || false,
                    is_winner_bracket: true,
                    team1: "",
                    team2: ""
                });
                setScheduleInfo(newScheduleInfo);
            }}>
                添加新赛程
            </Button>
            {
                scheduleInfo.map((schedule, index) => {
                if (schedule.stage_name === Array.from(round)[0]) {
                    return (
                        <div key={index} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-5">
                                {
                                    schedule.is_lobby ?
                                        (
                                            <div className="flex flex-col gap-5">
                                                <div className="text-xl font-bold">
                                                    基本信息
                                                </div>
                                                <div className={"flex flex-row gap-5 items-baseline"}>
                                                    <Input className="max-w-[80px]" label="比赛序号" value={schedule.match_id}
                                                           description="不能重复" onChange={(e) => {
                                                        let newScheduleInfo = [...scheduleInfo];
                                                        newScheduleInfo[index].match_id = e.target.value;
                                                        setScheduleInfo(newScheduleInfo);
                                                    }}
                                                    />
                                                    <Input label="比赛名称" value={schedule.name} isRequired
                                                           isInvalid={!!errMsg && !schedule.name}
                                                           description="如 Lobby A"
                                                           onChange={(e) => {
                                                        let newScheduleInfo = [...scheduleInfo];
                                                        newScheduleInfo[index].name = e.target.value;
                                                        setScheduleInfo(newScheduleInfo);
                                                    }}
                                                    />
                                                    <Input type="date" label="日期" isRequired isInvalid={!!errMsg && !schedule.match_time} value={schedule.match_time?(new Date(schedule.match_time)).toISOString().split('T')[0]:""} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            let datetime = new Date();
                                                            datetime.setFullYear(parseInt(e.target.value.split('-')[0]));
                                                            datetime.setMonth(parseInt(e.target.value.split('-')[1])-1);
                                                            datetime.setDate(parseInt(e.target.value.split('-')[2]));
                                                            newScheduleInfo[index].match_time = datetime.toISOString();
                                                            setScheduleInfo(newScheduleInfo);
                                                        }}
                                                           placeholder="Enter your email" />
                                                    <Input type="time" label="时间" isRequired isInvalid={!!errMsg && !schedule.match_time} value={schedule.match_time?(new Date(schedule.match_time)).toTimeString().split(' ')[0].substring(0, 5):""} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            let datetime = new Date();
                                                            datetime.setHours(parseInt(e.target.value.split(':')[0]));
                                                            datetime.setMinutes(parseInt(e.target.value.split(':')[1]));
                                                            newScheduleInfo[index].match_time = datetime.toISOString();
                                                            setScheduleInfo(newScheduleInfo);
                                                        }
                                                    } placeholder="Enter your email" />
                                                    <Input label="比赛网址" value={schedule.match_url}
                                                           description="格式为https://osu.ppy.sh/community/matches/xxxxxxx" onChange={(e) => {
                                                        let newScheduleInfo = [...scheduleInfo];
                                                        newScheduleInfo[index].match_url = e.target.value;
                                                        setScheduleInfo(newScheduleInfo);
                                                    }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div className={"flex flex-col gap-5"}>
                                                        <div className="text-xl font-bold">
                                                            裁判
                                                        </div>
                                                        <GroupMemberSelect members={members.filter((member) => member.referee)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} role="referee" index={index} />
                                                        <div className="flex flex-wrap gap-5">
                                                            {
                                                                schedule.referee?.map((referee, memberIndex) => {
                                                                    const member = members.find((member) => member.name === referee);
                                                                    if (!member)
                                                                        return null;
                                                                    return(
                                                                        <Chip
                                                                            key={referee}
                                                                            variant="bordered"
                                                                            size="lg"
                                                                            onClose={() => {
                                                                                const newScheduleInfo = [...scheduleInfo];
                                                                                newScheduleInfo[index].referee?.splice(memberIndex, 1);
                                                                                setScheduleInfo(newScheduleInfo);
                                                                            }}
                                                                            avatar={
                                                                                <Avatar
                                                                                    size="lg"
                                                                                    name={member.name}
                                                                                    src={`https://a.ppy.sh/${member.uid}`}
                                                                                />
                                                                            }
                                                                        >
                                                                            {member.name}
                                                                        </Chip>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className={"flex flex-col gap-5"}>
                                                        <div className="text-xl font-bold">
                                                            选手
                                                        </div>
                                                        <GroupMemberSelect members={members.filter((member) => member.player)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} role="participant" index={index} />
                                                        <div className="flex flex-wrap gap-5">
                                                            {
                                                                schedule.participants?.map((participant, memberIndex) => {
                                                                    const member = members.find((member) => member.name === participant);
                                                                    if (!member)
                                                                        return null;
                                                                    return(
                                                                        <Chip
                                                                            key={participant}
                                                                            variant="bordered"
                                                                            size="lg"
                                                                            onClose={() => {
                                                                                const newScheduleInfo = [...scheduleInfo];
                                                                                newScheduleInfo[index].participants?.splice(memberIndex, 1);
                                                                                setScheduleInfo(newScheduleInfo);
                                                                            }}
                                                                            avatar={
                                                                                <Avatar
                                                                                    size="lg"
                                                                                    name={member.name}
                                                                                    src={`https://a.ppy.sh/${member.uid}`}
                                                                                />
                                                                            }
                                                                        >
                                                                            {member.name}
                                                                        </Chip>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button className="max-w-fit" color="danger" onPress={() => {
                                                    const newScheduleInfo = scheduleInfo.filter((_, i) => i !== index);
                                                    setScheduleInfo(newScheduleInfo);
                                                }}>
                                                    删除
                                                </Button>
                                            </div>
                                        ) :
                                        (
                                            <div className="flex flex-col gap-5">
                                                <div className="text-xl font-bold">
                                                    基本信息
                                                </div>
                                                <div className="flex flex-row gap-5 items-baseline">
                                                    <Input className="max-w-[80px]" label="比赛序号" value={schedule.match_id}
                                                           description="不能重复" onChange={(e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            newScheduleInfo[index].match_id = e.target.value;
                                                            setScheduleInfo(newScheduleInfo);
                                                        }}
                                                    />
                                                    <MemberSelect members={members.filter((member) => member.player)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} team="team1" index={index} errMsg={errMsg} />
                                                    <MemberSelect members={members.filter((member) => member.player)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} team="team2" index={index} errMsg={errMsg} />
                                                    <Input type="date" label="日期" isRequired isInvalid={!!errMsg && !schedule.match_time}
                                                           value={schedule.match_time?(new Date(schedule.match_time)).toISOString().split('T')[0]:""} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            let datetime = new Date();
                                                            datetime.setFullYear(parseInt(e.target.value.split('-')[0]));
                                                            datetime.setMonth(parseInt(e.target.value.split('-')[1])-1);
                                                            datetime.setDate(parseInt(e.target.value.split('-')[2]));
                                                            newScheduleInfo[index].match_time = datetime.toISOString();
                                                            setScheduleInfo(newScheduleInfo);
                                                       }}
                                                           placeholder="Enter your email" />
                                                    <Input type="time" label="时间" isRequired isInvalid={!!errMsg && !schedule.match_time} value={schedule.match_time?(new Date(schedule.match_time)).toTimeString().split(' ')[0].substring(0, 5):""} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            let datetime = new Date();
                                                            datetime.setHours(parseInt(e.target.value.split(':')[0]));
                                                            datetime.setMinutes(parseInt(e.target.value.split(':')[1]));
                                                            newScheduleInfo[index].match_time = datetime.toISOString();
                                                            setScheduleInfo(newScheduleInfo);
                                                        }
                                                    } placeholder="Enter your email" />
                                                    <Switch className="min-w-fit" defaultSelected={schedule.is_winner_bracket} onChange={
                                                        (e) => {
                                                            let newScheduleInfo = [...scheduleInfo];
                                                            newScheduleInfo[index].is_winner_bracket = e.target.checked;
                                                            setScheduleInfo(newScheduleInfo);
                                                        }
                                                    }>
                                                        是否为胜者组
                                                    </Switch>
                                                </div>
                                                <div className="grid grid-cols-3 gap-5">
                                                    <div className={"flex flex-col gap-5"}>
                                                        <div className="text-xl font-bold">
                                                            裁判
                                                        </div>
                                                        <GroupMemberSelect members={members.filter((member) => member.referee)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} role="referee" index={index} />
                                                        <div className="flex flex-wrap gap-5">
                                                            {
                                                                schedule.referee?.map((referee, memberIndex) => {
                                                                    const member = members.find((member) => member.name === referee);
                                                                    if (!member)
                                                                        return null;
                                                                    return(
                                                                        <Chip
                                                                            key={referee}
                                                                            variant="bordered"
                                                                            size="lg"
                                                                            onClose={() => {
                                                                                const newScheduleInfo = [...scheduleInfo];
                                                                                newScheduleInfo[index].referee?.splice(memberIndex, 1);
                                                                                setScheduleInfo(newScheduleInfo);
                                                                            }}
                                                                            avatar={
                                                                                <Avatar
                                                                                    size="lg"
                                                                                    name={member.name}
                                                                                    src={`https://a.ppy.sh/${member.uid}`}
                                                                                />
                                                                            }
                                                                        >
                                                                            {member.name}
                                                                        </Chip>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className={"flex flex-col gap-5"}>
                                                        <div className="text-xl font-bold">
                                                            直播
                                                        </div>
                                                        <GroupMemberSelect members={members.filter((member) => member.streamer)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} role="streamer" index={index} />
                                                        <div className="flex flex-wrap gap-5">
                                                            {
                                                                schedule.streamer?.map((referee, memberIndex) => {
                                                                    const member = members.find((member) => member.name === referee);
                                                                    if (!member)
                                                                        return null;
                                                                    return(
                                                                        <Chip
                                                                            key={referee}
                                                                            variant="bordered"
                                                                            size="lg"
                                                                            onClose={() => {
                                                                                const newScheduleInfo = [...scheduleInfo];
                                                                                newScheduleInfo[index].streamer?.splice(memberIndex, 1);
                                                                                setScheduleInfo(newScheduleInfo);
                                                                            }}
                                                                            avatar={
                                                                                <Avatar
                                                                                    size="lg"
                                                                                    name={member.name}
                                                                                    src={`https://a.ppy.sh/${member.uid}`}
                                                                                />
                                                                            }
                                                                        >
                                                                            {member.name}
                                                                        </Chip>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className={"flex flex-col gap-5"}>
                                                        <div className="text-xl font-bold">
                                                            解说
                                                        </div>
                                                        <GroupMemberSelect members={members.filter((member) => member.referee)} scheduleInfo={scheduleInfo} setScheduleInfo={setScheduleInfo} role="commentator" index={index} />
                                                        <div className="flex flex-wrap gap-5">
                                                            {
                                                                schedule.commentators?.map((referee, memberIndex) => {
                                                                    const member = members.find((member) => member.name === referee);
                                                                    if (!member)
                                                                        return null;
                                                                    return(
                                                                        <Chip
                                                                            key={referee}
                                                                            variant="bordered"
                                                                            size="lg"
                                                                            onClose={() => {
                                                                                const newScheduleInfo = [...scheduleInfo];
                                                                                newScheduleInfo[index].commentators?.splice(memberIndex, 1);
                                                                                setScheduleInfo(newScheduleInfo);
                                                                            }}
                                                                            avatar={
                                                                                <Avatar
                                                                                    size="lg"
                                                                                    name={member.name}
                                                                                    src={`https://a.ppy.sh/${member.uid}`}
                                                                                />
                                                                            }
                                                                        >
                                                                            {member.name}
                                                                        </Chip>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row gap-5 items-baseline">
                                                    <Input label="比赛网址" value={schedule.match_url}
                                                           description="格式为https://osu.ppy.sh/community/matches/xxxxxxx" onChange={(e) => {
                                                        let newScheduleInfo = [...scheduleInfo];
                                                        newScheduleInfo[index].match_url = e.target.value;
                                                        setScheduleInfo(newScheduleInfo);
                                                    }}/>
                                                    <Input label="队伍1分数" value={schedule.team1_score?.toString() || ""}
                                                           onChange={(e) => {
                                                               let newScheduleInfo = [...scheduleInfo];
                                                               newScheduleInfo[index].team1_score = parseInt(e.target.value);
                                                               setScheduleInfo(newScheduleInfo);
                                                           }}/>
                                                    <Input label="队伍2分数" value={schedule.team2_score?.toString() || ""}
                                                            onChange={(e) => {
                                                                let newScheduleInfo = [...scheduleInfo];
                                                                newScheduleInfo[index].team2_score = parseInt(e.target.value);
                                                                setScheduleInfo(newScheduleInfo);
                                                          }}/>
                                                </div>
                                                <div className="flex flex-row gap-5 items-baseline">
                                                    <Button className="max-w-fit" color="danger" onPress={() => {
                                                        const newScheduleInfo = scheduleInfo.filter((_, i) => i !== index);
                                                        setScheduleInfo(newScheduleInfo);
                                                    }}>
                                                        删除
                                                    </Button>
                                                </div>

                                                </div>

                                        )
                                }
                            </div>
                            <Divider/>
                        </div>
                    )
                }
                }
            )}
            {isLoading ?  <Spinner className="max-w-fit" /> :
                <Button className="max-w-fit" color="primary" onPress={async () => {
                    if (!scheduleInfo.filter((schedule) => !schedule.is_lobby).every((schedule) => schedule.team1 && schedule.team2 && schedule.match_time) || !scheduleInfo.filter((schedule) => schedule.is_lobby).every((schedule) => schedule.name && schedule.match_time)) {
                        // 显示错误消息或采取其他适当的操作
                        setErrMsg('请填写所有必填字段')
                        return
                    }
                    setIsLoading(true)
                    const res = await fetch('http://localhost:8421/api/update-schedule', {'method': 'POST', 'body': JSON.stringify(scheduleInfo), 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
                    setIsLoading(false)
                    if (res.status != 200) {
                        // 失败
                        setErrMsg(await res.text());
                    } else {
                        // 关闭模态框
                        alert('修改成功');
                    }
                }}>
                    保存赛程
                </Button>
            }
            <div className="text-red-500">
                {errMsg}
            </div>
        </div>
    )
}


const MemberSelect = ({members, scheduleInfo, setScheduleInfo, team, index, errMsg}:
                          {
                              members: TournamentMember[],
                              scheduleInfo: Schedule[],
                              setScheduleInfo:  React.Dispatch<React.SetStateAction<Schedule[]>>,
                              team: "team1" | "team2",
                              index: number,
                              errMsg: string
                          }) => {

    const [fieldState, setFieldState] = useState<{selectedKey: string | null, inputValue: string, items: TournamentMember[]}>({
        selectedKey: members.find((member) => member.name === (team === "team1"? scheduleInfo[index].team1.toString(): scheduleInfo[index].team2.toString()))?.name || null,
        inputValue: members.find((member) => member.name === (team === "team1"? scheduleInfo[index].team1.toString(): scheduleInfo[index].team2.toString()))?.name || "",
        items: members,
    });
    useEffect(() => {
        const selectedMember = members.find((member) => member.name === (team === "team1" ? scheduleInfo[index].team1.toString() : scheduleInfo[index].team2.toString()));
        const selectedKey = selectedMember ? selectedMember.name : null;
        const inputValue = selectedMember ? selectedMember.name : "";

        setFieldState((prevState) => ({
            ...prevState,
            selectedKey,
            inputValue,
            items: members,
        }));
    }, [scheduleInfo, members, team, index]);
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
        if (!key)
            return
        let newScheduleInfo = [...scheduleInfo];
        if (!newScheduleInfo[index].is_lobby) {
            team === "team1" ? newScheduleInfo[index].team1 = key: newScheduleInfo[index].team2 = key;
            setScheduleInfo(newScheduleInfo);
        }
        setFieldState((prevState) => {
            let selectedItem = prevState.items.find((option) => option.name === key);
            return {
                inputValue: selectedItem?.name || "",
                selectedKey: key? key : "",
                items: members,
            };
        });
    };
    const onOpenChange = (isOpen: boolean, menuTrigger: MenuTriggerAction | undefined) => {
        if (menuTrigger === "manual" && isOpen) {
            setFieldState((prevState) => ({
            inputValue: prevState.inputValue,
            selectedKey: prevState.selectedKey,
            items: members,
        }));
    }};
    return (
        <Autocomplete
            label={team === "team1"? "队伍1": "队伍2"}
            className="max-w-xs"
            inputValue={fieldState.inputValue}
            items={fieldState.items}
            selectedKey={fieldState.selectedKey}
            isRequired
            isInvalid={!!errMsg && !fieldState.inputValue && !fieldState.selectedKey}
            // @ts-ignore
            onKeyDown={(e) => e.continuePropagation()}
            onInputChange={onInputChange}
            onOpenChange={onOpenChange}
            onClose={()=>{setFieldState((prevState) => ({
                inputValue: prevState.inputValue,
                selectedKey: prevState.selectedKey,
                items: members,
            }))
            }}
            // @ts-ignore
            onSelectionChange={onSelectionChange}
        >
            {(member) => (
                <AutocompleteItem key={member.name} textValue={member.name}>
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


const GroupMemberSelect = ({members, scheduleInfo, setScheduleInfo, role, index}:{members: TournamentMember[], scheduleInfo: Schedule[], setScheduleInfo:  React.Dispatch<React.SetStateAction<Schedule[]>>, role: "referee" | "participant" | "streamer" | "commentator", index: number}) => {
    const [fieldState, setFieldState] = useState<{selectedKey: string | null, inputValue: string, items: TournamentMember[]}>({
        selectedKey: null,
        inputValue: "",
        items: members,
    });
    let { contains } = useFilter({
        sensitivity: 'base'
    });
    return (
        <Autocomplete
            label={role === "participant"? "添加选手": role === "referee"? "添加裁判": role === "streamer"? "添加直播": "添加解说"}
            className=""
            inputValue={fieldState.inputValue}
            items={fieldState.items}
            selectedKey={fieldState.selectedKey}
            // @ts-ignore
            onKeyDown={(e) => e.continuePropagation()}
            onInputChange={(value) => {
                setFieldState((prevState) => ({
                inputValue: value,
                selectedKey: value === "" ? null : prevState.selectedKey,
                items: members.filter((item) => contains(item.uid + item.name, value)),
            }));}}
            onOpenChange={(isOpen, menuTrigger) => {
                if (menuTrigger === "manual" && isOpen) {
                    setFieldState((prevState) => ({
                        inputValue: prevState.inputValue,
                        selectedKey: prevState.selectedKey,
                        items: members,
                    }));
                }}}
            onSelectionChange={(key) => {
                if (!key)
                    return
                if (role === "participant"? scheduleInfo[index].participants?.includes(key as string): role === "referee"? scheduleInfo[index].referee?.includes(key as string): role === "streamer"? scheduleInfo[index].streamer?.includes(key as string): scheduleInfo[index].commentators?.includes(key as string))
                {
                    alert("该用户已存在")
                    return
                }
                let newScheduleInfo = [...scheduleInfo];
                role === "participant"? newScheduleInfo[index].participants?.push(key as string): role === "referee"? newScheduleInfo[index].referee?.push(key as string): role === "streamer"? newScheduleInfo[index].streamer?.push(key as string): newScheduleInfo[index].commentators?.push(key as string);
                setScheduleInfo(newScheduleInfo);
            }}
            onClose={()=>{setFieldState(() => ({
                inputValue: "",
                selectedKey: null,
                items: members}
            ))}}
        >
            {(member) => (
                <AutocompleteItem key={member.name} textValue={member.name}>
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
    referee?: string[];
    streamer?: string[];
    commentators?: string[];
    participants?: string[];
    team1: string;
    team2: string;
    team1_score?: number;
    team2_score?: number;
    team1_warmup?: number;
    team2_warmup?: number;
}
