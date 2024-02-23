"use client"


import {Tab, Tabs} from "@nextui-org/tabs";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/table";
import {Card, CardFooter, CardHeader} from "@nextui-org/card";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";
import React from "react";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {Stage} from "@/components/mappools";
import {Player} from "@/components/user_info";
import {useRouter, useSearchParams} from "next/navigation";


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

export const StatsComp = ({roundInfo, stats, stage, scores, players}: {roundInfo: TournamentRoundInfo[], stats: Stats[], stage: Stage[], scores: Score[], players: Player[]}) => {
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
            {roundInfo.map((round) => {
                return (
                    <Tab key={round.stage_name} title={round.stage_name} className="flex flex-col gap-3">
                        <Tabs aria-label="Dynamic tabs" className={"flex flex-row justify-center"} size={"lg"} classNames={{
                            tabList: "gap-3 flex flex-row flex-auto",
                            tab: "min-h-[40px] flex-auto",
                            tabContent: "text-xl",
                        }}>
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
                                                maps.maps.map((map) => (
                                                    <div key={map.map_id} className="max-w-lg scroll-ms-6 shrink-0 relative flex flex-col gap-3 py-3 rotate-180">
                                                        <Card key={map.map_id} className={""}>
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
                                                                className="z-0 w-full h-[180px] object-cover dark:brightness-50"
                                                                alt="Card background"
                                                                width="100%"
                                                                loading={"lazy"}
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
                                                        <Card>
                                                            {
                                                                scores.filter((score) => score.stage_name === round.stage_name && score.map_id === map.map_id).length > 0 ?
                                                                    scores.filter((score) => score.stage_name === round.stage_name && score.map_id === map.map_id).sort((a, b) => b.score - a.score).map((score, index) => (
                                                                        <div key={index} className="grid grid-cols-3 gap-3 p-3">
                                                                            <div className="flex flex-row gap-2">
                                                                                <div>
                                                                                    {index + 1}
                                                                                </div>
                                                                                <Link isExternal color="foreground" href={`https://osu.ppy.sh/users/${score.player}`}>
                                                                                    {players.filter((player) => player.uid.toString() === score.player)[0].name}
                                                                                </Link>
                                                                            </div>
                                                                            <div className="text-center">
                                                                                {score.score}
                                                                            </div>
                                                                            <div className="text-center">
                                                                                {(score.acc * 100).toFixed(2) + "%" }
                                                                            </div>
                                                                        </div>
                                                                    )):
                                                                    <div className="col-span-3 text-center p-3">
                                                                        暂无成绩
                                                                    </div>
                                                            }
                                                        </Card>

                                                    </div>
                                                ))
                                            )): null
                                    }
                                </div>
                            </Tab>
                        </Tabs>
                    </Tab>
                )
            })}
        </Tabs>
    )
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

interface Score {
    tournament_name: string;
    stage_name: string;
    map_id: string;
    player: string;
    score: number;
    acc: number;
}
