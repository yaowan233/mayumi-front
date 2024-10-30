"use client";


import React, {useContext, useEffect, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import CurrentUserContext from "@/app/user_context";
import {Select, SelectItem} from "@nextui-org/select";
import {Button} from "@nextui-org/button";
import {siteConfig} from "@/config/site";

export default function EditStatisticsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const [round, setRound] = useState<Set<string>>(new Set([]));
    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const currentUser = useContext(CurrentUserContext);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getRoundInfo(params.tournament);
                setRoundInfo(data);
            }
        };
        fetchData();
    }, [currentUser, params.tournament]);

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold">
                数据管理
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
            {
                round.size > 0 ?(
                    <div className="flex flex-col gap-5">
                        <p>
                            当该轮次所有比赛网页信息都正确填写之后，点击下方按钮更新比赛数据，数据会自动生成，如有错误请联系管理员
                        </p>
                        <Button className="max-w-fit" color="primary" onClick={async () => {
                            const res = await fetch(siteConfig.backend_url + `/api/get-stage-plays?tournament_name=${params.tournament}&stage_name=${Array.from(round)[0]}`,
                                { next: { revalidate: 0 }})
                            if (res.status != 200) {
                                // 失败
                                alert(await res.text());
                                return;
                            }
                            else {
                                alert('更新成功');
                            }
                        }}>
                                更新比赛数据
                        </Button>
                    </div>
                ) : (
                    <p>请先选择比赛轮次</p>
                )
            }
        </div>
    )
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 }});
    return await data.json();
}
