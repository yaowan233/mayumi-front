"use client"
import {Card, CardBody} from "@nextui-org/card";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/table";
import {Spinner} from "@nextui-org/spinner";
import React from "react";
import {Tab, Tabs} from "@nextui-org/tabs";
import {useAsyncList} from "@react-stately/data";


const columns = [
    {name: "Mod", key: "mod"},
    {name: "最低分", key: "lowest_score"},
    {name: "平均分", key: "average_score"},
    {name: "最高分", key: "highest_score"},
    {name: "最低acc", key: "lowest_acc"},
    {name: "平均acc", key: "average_acc"},
    {name: "最高acc", key: "highest_acc"},
    {name: "最低miss", key: "lowest_miss"},
    {name: "平均miss", key: "average_miss"},
    {name: "最高miss", key: "highest_miss"},
    {name: "被选次数", key: "times_picked"},
    {name: "被选率", key: "picked_pct"},
    {name: "被ban次数", key: "times_banned"},
    {name: "被ban率", key: "banned_pct"},
    {name: "fail次数", key: "times_failed"},
];

export default function StatsPage({params}: { params: { tournament: string } }) {
    const [isLoading, setIsLoading] = React.useState(true);
    let list = useAsyncList({
        async load({signal}) {
            let res = await fetch('http://127.0.0.1:8421/api/round_stats?name=' + params.tournament);
            let json = await res.json();
            setIsLoading(false);
            return {
                items: json,
            };
        },
        async sort({items, sortDescriptor}) {
            return {
                items: items.sort((a, b) => {
                    // @ts-ignore
                    let first = a[sortDescriptor.column];
                    // @ts-ignore
                    let second = b[sortDescriptor.column];
                    let cmp = (parseInt(first) || first) < (parseInt(second) || second) ? -1 : 1;

                    if (sortDescriptor.direction === "descending") {
                        cmp *= -1;
                    }

                    return cmp;
                }),
            };
        },
    })
    return (
        <Tabs classNames={{
            cursor: "w-full bg-[#22d3ee]",
            tab: "max-w-fit px-0 h-8",
            tabContent: "group-data-[selected=true]:text-[#06b6d4]"
        }} aria-label="Dynamic tabs" items={list.items}>
            {(item) => (
                // @ts-ignore
                <Tab key={item.stage_name} title={item.stage_name}>
                    <Table
                        sortDescriptor={list.sortDescriptor}
                        onSortChange={list.sort}
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
                            // @ts-ignore
                            items={item.map_pool_stats}
                            isLoading={isLoading}
                            loadingContent={<Spinner label="Loading..." />}
                        >
                            {(item) => (
                                // @ts-ignore
                                <TableRow key={item.mod}>
                                    {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Tab>
            )}
        </Tabs>
    );
}

interface RoundStats {
    stage_name: string;
    map_pool_stats:{
      mod: string;
      lowest_score: number;
      average_score: number;
      highest_score: number;
      lowest_acc: number;
      average_acc: number;
      highest_acc: number;
      lowest_miss: number;
      average_miss: number;
      highest_miss: number;
      times_picked: number;
      picked_pct: string;
      times_banned: number;
      banned_pct: string;
      times_failed: number;
    }[]
}
