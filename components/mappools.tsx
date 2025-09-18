"use client"
import {Tab, Tabs} from "@heroui/tabs";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {Link} from "@heroui/link";
import {Image} from "@heroui/image";
import React, {useState} from 'react';
import {Button} from "@heroui/button";
import {CopyIcon, DownloadIcon} from "@/components/icons";
import {Tooltip} from "@heroui/tooltip";
import {useSearchParams, useRouter} from "next/navigation";
import {Chip} from "@heroui/chip";


export const MappoolsComponents = ({tabs}: {tabs: Stage[] }) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    return (
        <Tabs aria-label="Dynamic tabs" items={tabs} className={"flex justify-center"} size={"lg"} defaultSelectedKey={searchParams.get('stage') || tabs.at(-1)?.stage_name}
              onSelectionChange={(key) => {router.replace(`?stage=${key}`)}}
              classNames={{
                tabList: "gap-6 flex",
                tab: "min-h-[50px]",
                tabContent: "text-3xl",
        }}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name} id={item.stage_name}>
                    <div className="grid grid-cols-1 gap-6">
                        {item.mod_bracket.map((mod_bracket) => (
                            <Card key={mod_bracket.mod}>
                                <CardHeader className={"flex justify-center"}>
                                    <div className="text-4xl">
                                        {mod_bracket.mod}
                                    </div>
                                </CardHeader>
                                <CardBody className={"flex flex-wrap flex-row justify-center gap-4"}>
                                    {
                                        mod_bracket.maps.map((map, index) => (
                                            <MapComponent map={map} key={map.map_id} index={index} mod={mod_bracket.mod}/>
                                        ))
                                    }
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </Tab>
            )}
        </Tabs>
    );
}

const MapComponent = ({map, index, mod}: {map: Map, index: number, mod: string}) => {
    const [isHovered, setIsHovered] = useState(false);
    const colors = {
        "HD": "warning",
        "HR": "danger",
        "DT": "success",
        "RC": "primary",
        "LN": "success",
        "HB": "warning",
        "TB": "secondary",
    } as const;
    type AllowedColors = typeof colors[keyof typeof colors] | "default";
    const color: AllowedColors = colors[mod as keyof typeof colors] || "default";
    return(
        <Card key={map.map_id} className={"max-w-lg"} onMouseEnter={() => {setIsHovered(true)}}  onMouseLeave={() => {setIsHovered(false)}}>
            <CardHeader className="absolute z-10 top-0 flex-col items-center">
                <Link isExternal size={"lg"} color={"foreground"}
                      className="font-bold leading-5 text-center"
                      href={`https://osu.ppy.sh/b/${map.map_id}`}>
                    <p className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        {map.map_name} [{map.diff_name}]
                    </p>
                </Link>
                <Link isExternal color={"foreground"} href={`https://osu.ppy.sh/users/${map.mapper}`}>
                    <p className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        {map.mapper}
                    </p>
                </Link>
                <div className="flex flex-row gap-2">
                    <Chip size="lg" className="mt-3 text-xl" color={color}>
                        {mod} {index + 1}
                    </Chip>
                    {
                        map.extra?.map((extra, i) => {
                            if (extra === "") return null
                            return(
                                <Chip key={i} size="lg" className="mt-3 text-xl" color={color}>
                                    {extra}
                                </Chip>
                            )
                        })
                    }
                </div>
                <div className="grid grid-cols-3 place-items-center w-full mt-3 text-gray-50 text-stroke dark:no-text-stroke">
                    <div className="line-clamp-1">
                        ★{map.star_rating}
                    </div>
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        bpm {map.bpm}
                    </div>
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        {map.length}
                    </div>
                </div>
                <div className="grid grid-cols-4 place-items-center w-full">
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        CS {map.cs}
                    </div>
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        HP {map.hp}
                    </div>
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
                        OD {map.od}
                    </div>
                    <div className="line-clamp-1 text-gray-50 text-stroke dark:no-text-stroke">
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
            {
                isHovered &&
                <div className='absolute z-20 flex flex-col gap-1'>
                    <Tooltip content="复制地图id" placement="right">
                        <Button size="sm" isIconOnly className="bg-amber-50" onPress={async () => {await navigator.clipboard.writeText(map.map_id)}}>
                            <CopyIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip content="复制mp指令" placement="right">
                        <Button size="sm" isIconOnly className="bg-amber-50" onPress={async () => {await navigator.clipboard.writeText(`!mp map ${map.map_id}`)}}>
                            <CopyIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip content="使用镜像站下载" placement="right">
                        <Button size="sm" isIconOnly className="bg-amber-50" as={Link} href={`https://dl.sayobot.cn/beatmaps/download/novideo/${map.map_set_id}`}>
                            <DownloadIcon/>
                        </Button>
                    </Tooltip>
                </div>
            }
        </Card>
    )
}

export interface Stage {
    stage_name: string;
    mod_bracket: {
        mod: string;
        maps: Map[]
    }[]
}

interface Map {
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
    extra?: string[];
}
