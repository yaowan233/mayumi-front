"use client";
import {Button} from "@heroui/button";
import {Select, SelectItem} from "@heroui/select";
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Image} from "@heroui/image";
import {Input} from "@heroui/input";
import {siteConfig} from "@/config/site";
import {InfoSection} from "@/components/hints";
import {TournamentInfo} from "@/components/homepage";


export default function EditTournamentMapPoolPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const [errMsg, setErrMsg] = useState('');
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [tournamentMaps, setTournamentMaps] = useState<TournamentMap[]>([]);
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({
        abbreviation: "",
        challonge_api_key: "",
        challonge_tournament_url: "",
        commentator: false,
        custom_mapper: false,
        description: "",
        designer: false,
        donator: false,
        end_date: "",
        is_group: false,
        is_verified: false,
        links: [],
        map_tester: false,
        mappooler: false,
        mode: "",
        name: "",
        pic_url: "",
        prize_info: "",
        rank_max: 0,
        rank_min: 0,
        referee: false,
        registration_info: "",
        rules_info: "",
        scheduler: false,
        staff_registration_info: "",
        start_date: "",
        streamer: false,
        tournament_schedule_info: ""
    });
    const [round, setRound] = useState<Set<string>>(new Set([]));
    const handleUpdateTournament = async () => {
        if (!tournamentMaps.every(tournamentMap => tournamentMap.map_id && tournamentMap.mod && tournamentMap.number)) {
            // 显示错误消息或采取其他适当的操作
            setErrMsg('请填写所有必填字段')
        } else if (validateModOrder(tournamentMaps)) {
            setErrMsg('同一轮次下同一mod的序号不能相同')
        } else {
            // 执行报名操作或其他相关逻辑
            const res = await fetch(siteConfig.backend_url + '/api/update-tournament-maps', {
                'method': 'POST',
                'body': JSON.stringify(tournamentMaps),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            })
            if (res.status != 200) {
                // 失败
                setErrMsg(await res.text());
            } else {
                alert('修改成功');
            }
        }
    }
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getRoundInfo(tournament_name);
                setRoundInfo(data);
            }
        };
        const fetchTournamentMapsData = async () => {
            const data = await getTournamentMaps(tournament_name);
            setTournamentMaps(data);
        }
        const fetchTournamentInfo = async () => {
            const data = await getTournamentInfo(tournament_name);
            setTournamentInfo(data);
        }
        fetchData();
        fetchTournamentMapsData()
        fetchTournamentInfo()
    }, [currentUser, tournament_name]);

    return (
        <div className="flex flex-col gap-5">
            <h1 className={"text-3xl font-bold"}>
                图池管理
            </h1>
            <InfoSection>
                <p className='text-black'>若没有所需比赛轮次，请主办先在轮次管理中添加比赛轮次</p>
            </InfoSection>
            <Select
                label="选择比赛轮次"
                className="max-w-xs"
                selectedKeys={round}
                // @ts-ignore
                onSelectionChange={setRound}
            >
                {roundInfo.map((round) => (
                    <SelectItem key={round.stage_name}>
                        {round.stage_name}
                    </SelectItem>
                ))}
            </Select>
            {round.size > 0 ? (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5">
                        {tournamentMaps.map((tournamentMap, index) => {
                            if (tournamentMap.stage_name !== Array.from(round)[0]) {
                                return null; // 不满足条件的元素返回 null
                            }
                            return (
                                <div key={index} className="flex flex-col">
                                    <div className="flex flex-row gap-5">
                                        <Image alt="bg" className="h-[60px] min-w-[100px]" width="100%"
                                               src={tournamentMap.map_id ? `https://osu.direct/api/media/background/${tournamentMap.map_id}` : undefined}/>
                                        <Input
                                            label="图号"
                                            isRequired
                                            value={tournamentMap.map_id?.toString() || ''}
                                            isInvalid={!!errMsg && !tournamentMap.map_id}
                                            onChange={(e) => {
                                                const updatedTournamentMaps = [...tournamentMaps];
                                                updatedTournamentMaps[index]['map_id'] = Number(e.target.value);
                                                setTournamentMaps(updatedTournamentMaps);
                                            }}
                                        />
                                        <Input
                                            label="mod"
                                            isRequired
                                            value={tournamentMap.mod}
                                            isInvalid={!!errMsg && !tournamentMap.mod}
                                            onChange={(e) => {
                                                const updatedTournamentMaps = [...tournamentMaps];
                                                updatedTournamentMaps[index]['mod'] = e.target.value;
                                                setTournamentMaps(updatedTournamentMaps);
                                            }}
                                        />
                                        <Input
                                            label="序号"
                                            isRequired
                                            value={tournamentMap.number?.toString() || ''}
                                            isInvalid={!!errMsg && !tournamentMap.number}
                                            onChange={(e) => {
                                                const updatedTournamentMaps = [...tournamentMaps];
                                                updatedTournamentMaps[index]['number'] = Number(e.target.value);
                                                setTournamentMaps(updatedTournamentMaps);
                                            }}
                                        />
                                        {
                                            tournamentMap.extra?.map((info, i) => {
                                                return (
                                                    <Input key={i} label="额外信息" value={info}
                                                           description="在这里加入对地图的额外介绍如地图风格，获胜条件"
                                                           onChange={(e) => {
                                                               const updatedTournamentMaps = [...tournamentMaps];
                                                               updatedTournamentMaps[index].extra?.splice(i, 1, e.target.value);
                                                               setTournamentMaps(updatedTournamentMaps);
                                                           }}/>
                                                )
                                            })
                                        }
                                        <div className="flex-col self-start">
                                            <Button radius={"none"} color="primary" isIconOnly onPress={() => {
                                                const updatedTournamentMaps = [...tournamentMaps];
                                                if (!updatedTournamentMaps[index].extra) {
                                                    updatedTournamentMaps[index].extra = [];
                                                }
                                                updatedTournamentMaps[index].extra?.push("");
                                                setTournamentMaps(updatedTournamentMaps);
                                            }}>+</Button>
                                            <Button radius={"none"} color="danger" isIconOnly onPress={() => {
                                                const updatedTournamentMaps = [...tournamentMaps];
                                                if (updatedTournamentMaps[index].extra && updatedTournamentMaps[index].extra?.length > 1) {
                                                    updatedTournamentMaps[index].extra?.pop();
                                                }
                                                setTournamentMaps(updatedTournamentMaps);
                                            }}>-</Button>
                                        </div>
                                    </div>
                                    <Button
                                        className="max-w-fit"
                                        color="danger"
                                        onPress={() => {
                                            const updatedTournamentMaps = tournamentMaps.filter((_, i) => i !== index);
                                            setTournamentMaps(updatedTournamentMaps);
                                        }}
                                    >
                                        删除
                                    </Button>
                                </div>)
                        })}
                    </div>
                    <div className="flex flex-row gap-5">
                        <Button className="max-w-fit" color="primary" onPress={() => {
                            setTournamentMaps([...tournamentMaps, {
                                tournament_name: tournament_name,
                                stage_name: Array.from(round)[0],
                                mod: '',
                                map_id: undefined,
                                number: undefined,
                                mode: tournamentInfo.mode,
                                extra: []
                            }])
                        }}>
                            添加地图
                        </Button>
                        <Button color="success" className="max-w-fit" onPress={handleUpdateTournament}>
                            保存图池
                        </Button>
                    </div>
                </div>
            ) : (
                <p>请选择比赛轮次</p>
            )
            }
            <div className="text-red-500">
                {errMsg}
            </div>
        </div>
    )
}

async function getTournamentMaps(tournament_name: string): Promise<TournamentMap[]> {
    const data = await fetch(siteConfig.backend_url + `/api/get_tournament_maps?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}


function validateModOrder(tournamentMaps: TournamentMap[]): boolean {
    for (let i = 0; i < tournamentMaps.length; i++) {
        for (let j = i + 1; j < tournamentMaps.length; j++) {
            const map1 = tournamentMaps[i];
            const map2 = tournamentMaps[j];

            // 在同一轮次下的不同对象进行比较
            if (
                map1.stage_name === map2.stage_name &&
                map1.mod === map2.mod &&
                map1.number === map2.number
            ) {
                return true;
            }
        }
    }

    return false;
}

interface TournamentMap {
    tournament_name: string;
    stage_name: string;
    mod?: string;
    map_id?: number;
    number?: number;
    mode?: string;
    extra?: string[];
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}

async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        {next: {revalidate: 10}})
    return await res.json()
}
