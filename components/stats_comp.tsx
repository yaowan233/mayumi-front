"use client"


import {Tab, Tabs} from "@nextui-org/tabs";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/table";
import {Card, CardHeader} from "@nextui-org/card";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";
import React, {useEffect, useState} from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Stage} from "@/components/mappools";
import {useRouter, useSearchParams} from "next/navigation";
import {Chip} from "@nextui-org/chip";
import {Player} from "@/app/tournaments/[tournament]/participants/page";
import {siteConfig} from "@/config/site";


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

export const StatsComp = ({roundInfo, stats, stage, scores, players}: {roundInfo: TournamentRoundInfo[], stats: Stats[], stage: Stage[], scores: Score[], players?: Player[]}) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    return (
        <Tabs aria-label="Dynamic tabs" className={"flex flex-row justify-center"} size={"lg"} defaultSelectedKey={searchParams.get('stage') || roundInfo.at(-1)?.stage_name}
              onSelectionChange={(key) => {router.replace(`?stage=${key}`)}}
              classNames={{
                tabList: "gap-3 flex flex-row flex-auto",
                tab: "min-h-[45px] flex-auto",
                tabContent: "text-2xl",
        }}>
            {roundInfo.map((round) => (
                    <Tab key={round.stage_name} title={round.stage_name} className="flex flex-col gap-3">
                        <Tabs aria-label="Dynamic tabs" className={"flex flex-row justify-center"} size={"lg"} classNames={{
                            tabList: "gap-3 flex flex-row flex-auto",
                            tab: "min-h-[40px] flex-auto",
                            tabContent: "text-xl",
                        }}>
                            { round.is_lobby && <Tab key={"leaderboard"} title={"排行榜"} className="flex flex-col gap-3 py-0">
                                {Leaderboard({round})}
                            </Tab>
                            }
                            <Tab key={"stats"} title={"图池统计"} className="flex flex-col gap-3 py-0">
                                <Table>
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
                                    >
                                        {(item) => (
                                            <TableRow key={item.mod_name}>
                                                {(columnKey) => {
                                                    if (columnKey === 'acc_max' || columnKey === 'acc_min' || columnKey === 'acc_avg') {
                                                        return <TableCell>{getKeyValue(item, columnKey) ? (getKeyValue(item, columnKey) * 100).toFixed(2) + "%" : null}</TableCell>
                                                    }
                                                    return (<TableCell>{getKeyValue(item, columnKey)}</TableCell>)
                                                }}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Tab>
                            <Tab key={"scores"} title={"单图排行"} className="flex flex-col gap-3 py-0">
                                <div className="w-full flex flex-row-reverse gap-3 overflow-x-auto pb-2 scroll-smooth rotate-180">
                                    {
                                        stage.filter((stage) => stage.stage_name === round.stage_name).length > 0?
                                            stage.filter((stage) => stage.stage_name === round.stage_name)[0].mod_bracket.map((maps) => (
                                                maps.maps.map((map, index) => {
                                                    const is_contain_mods = scores.filter((score) => score.stage_name === round.stage_name && score.map_id === map.map_id).some(score => score.mod.some(mod => mod !== 'NF' && mod !== maps.mod))
                                                    return (
                                                        <div key={map.map_id}
                                                             className="max-w-lg scroll-ms-6 shrink-0 relative flex flex-col gap-3 py-3 rotate-180">
                                                            <Card key={map.map_id} className={""}>
                                                                <CardHeader
                                                                    className="absolute z-10 top-0 flex-col items-center">
                                                                    <Link isExternal size={"lg"} color={"foreground"}
                                                                          className="font-bold leading-5 text-center"
                                                                          href={`https://osu.ppy.sh/b/${map.map_id}`}>
                                                                        <p className="line-clamp-1">
                                                                            {map.map_name} [{map.diff_name}]
                                                                        </p>
                                                                    </Link>
                                                                    <Link isExternal color={"foreground"} className=""
                                                                          href={`https://osu.ppy.sh/users/${map.mapper}`}>
                                                                        {map.mapper}
                                                                    </Link>
                                                                    <Chip size="lg" className="mt-3 text-xl"
                                                                          color={maps.mod === "HD" ? "warning" : maps.mod === "HR" ? "danger" : maps.mod === "DT" ? "secondary" : maps.mod === "TB" ? "success" : "default"}>
                                                                        {maps.mod} {index + 1}
                                                                    </Chip>
                                                                    <div
                                                                        className="grid grid-cols-3 place-items-center w-full mt-3">
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
                                                                    <div
                                                                        className="grid grid-cols-4 place-items-center w-full">
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
                                                                    className="z-0 w-full h-[160px] object-cover dark:brightness-50"
                                                                    alt="Card background"
                                                                    width="100%"
                                                                    src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}/>
                                                            </Card>
                                                            <Card>
                                                                {
                                                                    scores.filter((score) => score.stage_name === round.stage_name && score.map_id === map.map_id).length > 0 ?
                                                                        scores.filter((score) => score.stage_name === round.stage_name && score.map_id === map.map_id).sort((a, b) => b.score - a.score).map((score, index) => {
                                                                                if (is_contain_mods) {
                                                                                    return (
                                                                                        <div key={index}
                                                                                             className="grid grid-cols-4 gap-3 p-3">
                                                                                            <div
                                                                                                className="flex flex-row gap-2">
                                                                                                <div>
                                                                                                    {index + 1}
                                                                                                </div>
                                                                                                <Link isExternal
                                                                                                      color="foreground"
                                                                                                      href={`https://osu.ppy.sh/users/${score.player}`}>
                                                                                                    {players?.filter((player) => player.uid.toString() === score.player)[0].name}
                                                                                                </Link>
                                                                                            </div>
                                                                                            <div className="text-center">
                                                                                                {score.mod.filter((mod) => mod !== 'NF' && mod !== maps.mod).join(' ')}
                                                                                            </div>
                                                                                            <div className="text-center">
                                                                                                {score.score}
                                                                                            </div>
                                                                                            <div className="text-center">
                                                                                                {(score.acc * 100).toFixed(2) + "%"}
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                                return (
                                                                                    <div key={index}
                                                                                         className="grid grid-cols-3 gap-3 p-3">
                                                                                        <div
                                                                                            className="flex flex-row gap-2">
                                                                                            <div>
                                                                                                {index + 1}
                                                                                            </div>
                                                                                            <Link isExternal
                                                                                                  color="foreground"
                                                                                                  href={`https://osu.ppy.sh/users/${score.player}`}>
                                                                                                {players?.filter((player) => player.uid.toString() === score.player)[0].name}
                                                                                            </Link>
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            {score.score}
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            {(score.acc * 100).toFixed(2) + "%"}
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            }
                                                                        ) :
                                                                        <div className="col-span-3 text-center p-3">
                                                                            暂无成绩
                                                                        </div>
                                                                }
                                                            </Card>

                                                        </div>
                                                    )
                                                })
                                            )): null
                                    }
                                </div>
                            </Tab>
                        </Tabs>
                    </Tab>
                )
            )}
        </Tabs>
    )
}


const Leaderboard = ({round}: {round: TournamentRoundInfo}) => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const fetchLeaderboard = async (tournamentName: string, stageName: string) => {
        const res = await fetch(`${siteConfig.backend_url}/api/cal_rank?tournament_name=${tournamentName}&stage_name=${stageName}`,
            {next: {revalidate: 60}});
        return res.json();
    };
    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchLeaderboard(round.tournament_name, round.stage_name);
            setLeaderboard(data);
        };
        fetchData();
    }, [round]);
    const columns = Object.keys(leaderboard[0] || {});  // 提取第一行的数据作为表头
    if (columns.length === 0) {
        return null
    }
    return (
        <Table>
            <TableHeader>
                {columns.map((column) => (
                    <TableColumn key={column}>{column}</TableColumn>
                ))}
            </TableHeader>
            <TableBody>
                {leaderboard.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {columns.map((column) => (
                            <TableCell key={column}>
                                {row[column] !== undefined ? row[column] : 'N/A'}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

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

interface Score {
    tournament_name: string;
    stage_name: string;
    map_id: string;
    player: string;
    score: number;
    acc: number;
    mod: string[];
}
