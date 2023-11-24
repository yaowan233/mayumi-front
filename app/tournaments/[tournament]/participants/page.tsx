"use client"
import {Card, CardBody} from "@nextui-org/card";
import {Tab, Tabs} from "@nextui-org/tabs";
import {UserInfo} from "@/components/user_info";

export default function ParticipantsPage({ params }: { params: { tournament: string }}) {
    const users = [
        UserInfo({
        osu_id: "3162675",
        name: "Kyu",
        country: "CN",
        pp: "12345",
        rank: "123",
        timezone: "+8",
    }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
        UserInfo({
            osu_id: "3162675",
            name: "Kyu",
            country: "CN",
            pp: "12345",
            rank: "123",
            timezone: "+8",
        }),
    ];
    return (
        <Tabs aria-label="Options">
            <Tab key="solo" title="报名人员">
                <Card>
                    <CardBody>
                        <div className={"grid md:grid-cols-4 sm:grid-cols-3 gap-3"}>
                            {users.map((user, num) => (
                                <div key={num}>
                                    {user}
                                </div>
                                ))}
                        </div>
                    </CardBody>
                </Card>
            </Tab>
            <Tab key="teams" title="队伍">
                <Card>
                    <CardBody>
                    </CardBody>
                </Card>
            </Tab>
        </Tabs>
    )
}