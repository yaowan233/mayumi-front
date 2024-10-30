'use client'
import {Button} from "@nextui-org/button";
import {Link} from "@nextui-org/link";
import {Card, CardFooter, CardHeader} from "@nextui-org/card";
import {Chip} from "@nextui-org/chip";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";

export default function TournamentManagementPage() {
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

	return (
		<div className="flex flex-col gap-5">
			<Button as={Link} className="max-w-fit" href="/create-tournament">
				创建比赛
			</Button>
			<h1 className="text-3xl">比赛管理</h1>
			{tournamentManagementInfo ? (
				<div className="flex flex-wrap gap-5">
					{tournamentManagementInfo.map((info) =>
						<Card key={info.tournament_name} as={Link} href={`/tournament-management/${info.tournament_name}`} className="grow max-w-xs h-24">
							<CardHeader className="text-2xl">
								{info.tournament_name}
							</CardHeader>
							<CardFooter className="gap-2">
								职责：{info.roles.map((role) => <Chip key={role} color="primary">{role}</Chip>)}
							</CardFooter>
						</Card>)}
				</div>
			) : (
				<p>你还没有能够管理的比赛</p>
			)}
		</div>
	);
}

async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
	const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
		{ next: { revalidate: 10 }});
	return await data.json();
}

export interface TournamentManagementInfo {
	tournament_name: string;
	roles: string[];
}
