"use client"
import {Card, CardBody, CardHeader} from "@nextui-org/card";
import {Tab, Tabs} from "@nextui-org/tabs";
import {Image} from "@nextui-org/image";

export default function MapPollsPage({ params }: { params: { tournament: string }}) {
    let tabs: Stage[] = [
        {
            stage_name: "Qualifiers",
            mod_bracket: [
                {
                    mod: "NM",
                    maps: [
                        {
                            map_id: "2657995",
                            map_set_id: "1279485",
                            map_name: "map1",
                            mapper: "mapper1",
                            star_rating: "1",
                            ar: "1",
                            od: "1",
                            cs: "1",
                            hp: "1",
                            bpm: "1",
                            length: "1",
                            drain_time: "1",
                            number: "1",
                        },
                        {
                            map_id: "3893800",
                            map_set_id: "1847091",
                            map_name: "map2",
                            mapper: "mapper2",
                            star_rating: "2",
                            ar: "2",
                            od: "2",
                            cs: "2",
                            hp: "2",
                            bpm: "2",
                            length: "2",
                            drain_time: "2",
                            number: "2",
                        },
                        {
                            map_id: "4215029",
                            map_set_id: "2023583",
                            map_name: "map3",
                            mapper: "mapper3",
                            star_rating: "3",
                            ar: "3",
                            od: "3",
                            cs: "3",
                            hp: "3",
                            bpm: "3",
                            length: "3",
                            drain_time: "3",
                            number: "3",
                        },
                    ]
                },
                {
                    mod: "HR",
                    maps: [
                        {
                            map_id: "3248127",
                            map_set_id: "1590245",
                            map_name: "map1",
                            mapper: "mapper1",
                            star_rating: "1",
                            ar: "1",
                            od: "1",
                            cs: "1",
                            hp: "1",
                            bpm: "1",
                            length: "1",
                            drain_time: "1",
                            number: "1",
                        },
                        {
                            map_id: "2582515",
                            map_set_id: "1233837",
                            map_name: "map2",
                            mapper: "mapper2",
                            star_rating: "2",
                            ar: "2",
                            od: "2",
                            cs: "2",
                            hp: "2",
                            bpm: "2",
                            length: "2",
                            drain_time: "2",
                            number: "2",
                        },
                        {
                            map_id: "2425703",
                            map_set_id: "1153984",
                            map_name: "map3",
                            mapper: "mapper3",
                            star_rating: "3",
                            ar: "3",
                            od: "3",
                            cs: "3",
                            hp: "3",
                            bpm: "3",
                            length: "3",
                            drain_time: "3",
                            number: "3",
                        },
                    ]
                },
            ]
        }]
    return (
        <Tabs classNames={{
            cursor: "w-full bg-[#22d3ee]",
            tab: "max-w-fit px-0 h-8",
            tabContent: "group-data-[selected=true]:text-[#06b6d4]"
        }} aria-label="Dynamic tabs" items={tabs}>
            {(item) => (
                <Tab key={item.stage_name} title={item.stage_name}>
                    <div className="grid grid-cols-1 gap-6">
                        {item.mod_bracket.map((mod_bracket) => (
                            <Card key={mod_bracket.mod}>
                                <CardHeader>
                                    {mod_bracket.mod}
                                </CardHeader>
                                <CardBody>
                                <div className="grid grid-cols-2 gap-4">
                                    {
                                        mod_bracket.maps.map((map) => (
                                            <Card key={map.map_id}>
                                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                                    <p className="text-center">
                                                        {map.map_name}
                                                    </p>
                                                    <p className="text-center">
                                                        {map.mapper}
                                                    </p>
                                                </CardHeader>
                                                    <Image
                                                        removeWrapper
                                                        className="z-0 w-full h-full object-cover"
                                                        alt="Card background"
                                                        height={400}
                                                        src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}/>
                                            </Card>
                                        ))
                                    }
                                </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </Tab>
            )}
        </Tabs>
    )
}

interface Stage {
    stage_name: string;
    mod_bracket: {
        mod: string;
        maps: {
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
        }[]
    }[]
}
