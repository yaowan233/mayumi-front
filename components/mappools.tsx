"use client"
import {Tab, Tabs} from "@nextui-org/tabs";
import {Card, CardBody, CardFooter, CardHeader} from "@nextui-org/card";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";
import React, {useState} from 'react';
import {Button} from "@nextui-org/button";
import {CopyIcon, DownloadIcon} from "@/components/icons";
import {Tooltip} from "@nextui-org/tooltip";


export const MappoolsComponents = ({tabs}: {tabs: Stage[] }) => {
    return (
        <Tabs aria-label="Dynamic tabs" items={tabs} className={"flex justify-center"} size={"lg"} defaultSelectedKey={tabs.at(-1)?.stage_name}
              classNames={{
                tabList: "gap-6 flex",
                tab: "min-h-[50px]",
                tabContent: "text-3xl",
        }}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name}>
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
                                        mod_bracket.maps.map((map) => (
                                            <MapComponent map={map} key={map.map_id}/>
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

const MapComponent = ({map}: {map: Map}) => {
    const [isHovered, setIsHovered] = useState(false);

    return(
        <Card key={map.map_id} className={"max-w-lg"} onMouseEnter={() => {setIsHovered(true)}}  onMouseLeave={() => {setIsHovered(false)}}>
            <CardHeader className="absolute z-10 top-0 flex-col items-center">
                <Link isExternal size={"lg"} color={"foreground"}
                      className="font-bold leading-5 text-center"
                      href={`https://osu.ppy.sh/b/${map.map_id}`}>
                    <p className="line-clamp-2">
                        {map.map_name} [{map.diff_name}]
                    </p>
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
            {
                isHovered &&
                <div className='absolute z-20 flex flex-col gap-1'>
                    <Tooltip content="复制地图id">
                        <Button size="sm" isIconOnly className="bg-amber-50" onPress={async () => {await navigator.clipboard.writeText(map.map_set_id)}}>
                            <CopyIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip content="复制mp指令">
                        <Button size="sm" isIconOnly className="bg-amber-50" onPress={async () => {await navigator.clipboard.writeText(`!mp map ${map.map_set_id}`)}}>
                            <CopyIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip content="使用镜像站下载">
                        <Button size="sm" isIconOnly className="bg-amber-50" as={Link} href={`https://dl.sayobot.cn/beatmaps/download/novideo/${map.map_set_id}`}>
                            <DownloadIcon/>
                        </Button>
                    </Tooltip>
                </div>
            }
            <CardFooter className="absolute z-10 bottom-0 grid grid-rows-2">
                <div className="grid grid-cols-3 place-items-center">
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
                <div className="grid grid-cols-4 place-items-center">
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
            </CardFooter>
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
}
