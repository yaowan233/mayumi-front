"use client";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentManagementInfo} from "@/app/(home)/tournament-management/page";
import {Button} from "@nextui-org/button";
import {Link} from "@nextui-org/link";
import {siteConfig} from "@/config/site";

export default function ManagementHomePage({params}: { params: { tournament: string } }) {
    const currentUser = useContext(CurrentUserContext);
    const [tournamentManagementInfo, setTournamentManagementInfo] = useState<TournamentManagementInfo[] | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getTournamentManagementInfo(currentUser.currentUser.uid);
                setTournamentManagementInfo(data);
            }
        };

        fetchData();
    }, [currentUser]);
    const link_prefix = `/tournament-management/${params.tournament}`;
    return (
        <div className={'flex flex-wrap gap-3'}>
            <Button className="text-xl" as={Link} href={`${link_prefix}/meta`}>赛事信息管理</Button>
            <Button className="text-xl" as={Link} href={`${link_prefix}/round`}>轮次管理</Button>
            <Button className="text-xl" as={Link} href={`${link_prefix}/mappool`}>图池管理</Button>
            <Button className="text-xl" as={Link} href={`${link_prefix}/member`}>成员管理</Button>
            <Button className="text-xl" as={Link} href={`${link_prefix}/scheduler`}>赛程管理</Button>
            <Button className="text-xl" as={Link} href={`${link_prefix}/statistics`}>数据管理</Button>
        </div>
    )
}

async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
        { next: { revalidate: 10 }});
    return await data.json();
}
