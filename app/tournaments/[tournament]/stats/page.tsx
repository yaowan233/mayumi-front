"use client"

import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/table";
import {Spinner} from "@nextui-org/spinner";
import React, {useEffect} from "react";
import {Tab, Tabs} from "@nextui-org/tabs";
import {getRoundInfo, TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";


const columns = [
    {name: "", key: "mod_name"},
    {name: "最高分", key: "score_max"},
    {name: "最低分", key: "score_min"},
    {name: "平均分", key: "score_avg"},
    {name: "最高acc", key: "acc_max"},
    {name: "最低acc", key: "acc_min"},
    {name: "平均acc", key: "acc_avg"},
    {name: "最高miss数", key: "miss_max"},
    {name: "最低miss数", key: "miss_min"},
    {name: "平均miss数", key: "miss_avg"},
];

export default function StatsPage({params}: { params: { tournament: string } }) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [stats, setStats] = React.useState<Stats[]>([]);
    const [roundInfo, setRoundInfo] = React.useState<TournamentRoundInfo[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            const data = await getStats(params.tournament);
            setStats(data);
            const roundData = await getRoundInfo(params.tournament);
            setRoundInfo(roundData);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    return (
        <Tabs classNames={{
            cursor: "w-full bg-[#22d3ee]",
            tab: "max-w-fit px-0 h-8",
            tabContent: "group-data-[selected=true]:text-[#06b6d4]"
        }} aria-label="Dynamic tabs">
            {roundInfo.map((round) => {
                return (
                    <Tab key={round.stage_name} title={round.stage_name}>
                        <Table
                            classNames={{
                                table: "min-h-[400px]",
                            }}
                        >
                            <TableHeader columns={columns}>
                                {
                                    (column) => (
                                        <TableColumn key={column.key}>
                                            {column.name}
                                        </TableColumn>
                                    )
                                }
                            </TableHeader>
                            <TableBody
                                items={stats.filter((stat) => stat.stage_name === round.stage_name)}
                                isLoading={isLoading}
                                loadingContent={<Spinner label="加载中..."/>}
                            >
                                {(item) => (
                                    <TableRow key={item.stage_name}>
                                        {(columnKey) => {
                                            if (columnKey === 'acc_max' || columnKey === 'acc_min' || columnKey === 'acc_avg') {
                                                return <TableCell>{getKeyValue(item, columnKey)?(getKeyValue(item, columnKey) * 100).toFixed(2)+"%": null}</TableCell>
                                            }
                                            return (<TableCell>{getKeyValue(item, columnKey)}</TableCell>)
                                        }}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Tab>
                )
            })}
        </Tabs>
    );
}

async function getStats(tournament_name: string): Promise<Stats[]> {
    const res = await fetch('http://localhost:8421/api/stats?tournament_name=' + tournament_name,
        {next: {revalidate: 10}});
    return await res.json();
}


interface Stats {
    stage_name: string;
    mod_name: string;
    score_max?: number;
    score_min?: number;
    score_avg?: number;
    acc_max?: number;
    acc_min?: number;
    acc_avg?: number;
    miss_max?: number;
    miss_min?: number;
    miss_avg?: number;
}
