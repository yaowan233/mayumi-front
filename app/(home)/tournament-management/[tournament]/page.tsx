"use client";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentManagementInfo} from "@/app/(home)/tournament-management/page";
import {Button} from "@nextui-org/button";
import {Link} from "@nextui-org/link";
import {siteConfig} from "@/config/site";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";

export default function ManagementHomePage({params}: { params: { tournament: string } }) {
    const currentUser = useContext(CurrentUserContext);
    const [tournamentManagementInfo, setTournamentManagementInfo] = useState<TournamentManagementInfo[] | null>(null);
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({groups: undefined, players: []});
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getTournamentManagementInfo(currentUser.currentUser.uid);
                setTournamentManagementInfo(data);
                const tournament_players = await getPlayers(params.tournament, 120);
                setTournamentPlayers(tournament_players);
            }
        };
        fetchData();
    }, [currentUser, params.tournament]);
    const link_prefix = `/tournament-management/${params.tournament}`;
    return (
        <div className={'flex flex-wrap gap-3'}>
            {tournamentManagementInfo?.filter((info) =>
                info.tournament_name === params.tournament).map((info)=>
                info.roles.includes('主办')?
                    <div key='' className='flex flex-wrap gap-3'>
                        <Button className="text-xl" as={Link} href={`${link_prefix}/meta`}>赛事信息管理</Button>
                        <Button className="text-xl" as={Link} href={`${link_prefix}/round`}>轮次管理</Button>
                        <Button className="text-xl" as={Link} href={`${link_prefix}/member`}>成员管理</Button>
                        <Button className="text-xl" as={Link} href={`${link_prefix}/statistics`}>数据管理</Button>
                        <Button className="text-xl" as={Link} href={`${link_prefix}/team`} isDisabled={!tournamentPlayers.groups}>队伍管理</Button>
                    </div>
                : null)
            }
            {tournamentManagementInfo?.filter((info) =>
                info.tournament_name === params.tournament).map((info)=>
                info.roles.includes('主办') || info.roles.includes('选图')?
                    <Button key='1' className="text-xl" as={Link} href={`${link_prefix}/mappool`}>图池管理</Button>
                    : null)
            }
            {tournamentManagementInfo?.filter((info) =>
                info.tournament_name === params.tournament).map((info)=>
                info.roles.includes('主办') || info.roles.includes('时间安排')?
                    <Button key='2' className="text-xl" as={Link} href={`${link_prefix}/scheduler`}>赛程管理</Button>
                    : null)
            }
        </div>
    )
}

async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
        { next: { revalidate: 10 }});
    return await data.json();
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: revalidate_time }})
    return await res.json()
}
