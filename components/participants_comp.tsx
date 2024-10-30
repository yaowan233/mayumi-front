"use client"

import {Tab, Tabs} from "@nextui-org/tabs";
import {Card, CardBody} from "@nextui-org/card";
import {UserInfo} from "@/components/user_info";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Image} from "@nextui-org/image";
import {Link} from "@nextui-org/link";
import {Tooltip} from "@nextui-org/tooltip";

export const ParticipantsComp = ({tournament_players}: { tournament_players: TournamentPlayers }) => {
    const players = tournament_players.players
    const teams = tournament_players.groups
    return (
        <Tabs aria-label="Options">
            {teams ? <Tab key="teams" title="队伍">
                <Card>
                    <CardBody>
                        <div className={"grid md:grid-cols-4 sm:grid-cols-3 gap-3"}>
                            {teams?.map((team, num) => (
                                <div key={num} className={"flex flex-col border-2 p-2"}>
                                    <div className="flex flex-row mb-2">
                                        <Image alt="icon" height={64} width={64}
                                               src={team.icon_url ? team.icon_url : "https://a.ppy.sh"}/>
                                        <p className={"text-foreground text-center w-full text-2xl self-center line-clamp-1"}>
                                            {team.name}
                                        </p>
                                    </div>
                                    {team.captains.map((user, num) => {
                                        const player = players?.find(player => player.uid === user)
                                        if (player) {
                                            return (
                                                <div className="flex flex-row w-full justify-between" key={num}>
                                                    <Tooltip content="队长" placement="right">
                                                        <Link isExternal color="foreground" className="font-bold"
                                                              href={`https://osu.ppy.sh/u/${player.uid}`}>
                                                            {player.name}
                                                        </Link>
                                                    </Tooltip>
                                                    <div>
                                                        #{player.rank}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })}
                                    {team.members.map((user, num) => {
                                        const player = players?.find(player => player.uid === user)
                                        if (player) {
                                            return (
                                                <div className="flex flex-row w-full justify-between" key={num}>
                                                    <Link isExternal color="foreground"
                                                          href={`https://osu.ppy.sh/u/${player.uid}`}>
                                                        {player.name}
                                                    </Link>
                                                    <div>
                                                        #{player.rank}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </Tab> : null}
            <Tab key="solo" title="报名人员">
                <Card>
                    <CardBody className={"gap-4"}>
                        <div className={"text-3xl text-center"}>
                            报名人数：{players?.filter((player) => player.player == true).length}
                        </div>
                        <div className={"grid md:grid-cols-4 sm:grid-cols-3 gap-3"}>
                            {players?.filter((player) => player.player == true).sort((player1, player2) => player2.pp - player1.pp).map((user, num) => (
                                <UserInfo key={num} user={user}/>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </Tab>
        </Tabs>
    )
}
