"use client"

import {Tab, Tabs} from "@nextui-org/tabs";
import {Card, CardBody} from "@nextui-org/card";
import {Player, UserInfo} from "@/components/user_info";

export const ParticipantsComp = ({players}: { players: Player[] }) => {
    return (
        <Tabs aria-label="Options">
            <Tab key="solo" title="报名人员">
                <Card>
                    <CardBody>
                        <div className={"grid md:grid-cols-4 sm:grid-cols-3 gap-3"}>
                            {players.sort((player1, player2) => parseFloat(player2.pp) - parseFloat(player1.pp)).map((user, num) => (
                                <UserInfo key={num} user={user}/>
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
