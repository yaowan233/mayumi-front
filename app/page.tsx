import NextLink from "next/link";
import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import {title, subtitle, description_container} from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import {Navbar} from "@/components/navbar";
import Image from "next/image";
import {TournamentComponent} from "@/components/tournament_pic";
import {Tournament} from "@/components/tournament_pic";


export default async function Home() {
	let tournaments_data = await GetTournamentInfo()
	return (
		<>
			<Navbar/>
			{/*展示TournamentInfo图片*/}
			<div className="container flex mx-auto justify-center">
			<h1 className={title()}> 正在进行中的比赛 </h1>
			</div>
			<div className="container mx-auto max-w-7xl pt-4 px-6 flex-grow">
				<div className="flex flex-wrap items-center justify-center gap-2">
					{tournaments_data.filter((tournament) => (
						new Date(tournament.end_date) >= new Date()
					)).map((tournament) => (
						<TournamentComponent key={tournament.name} tournament={tournament} />
					))}
				</div>
			</div>
			<div className="container flex mx-auto justify-center">
				<h1 className={title()}> 已结束的比赛 </h1>
			</div>
			<div className="container mx-auto max-w-7xl pt-4 px-6 flex-grow">
				<div className="flex flex-wrap items-center justify-center gap-2">
					{tournaments_data.filter((tournament) => (
						new Date(tournament.end_date) < new Date()
					)).map((tournament) => (
						<TournamentComponent key={tournament.name} tournament={tournament} />
					))}
				</div>
			</div>
		</>
	);
}


async function GetTournamentInfo() : Promise<Tournament[]> {
	const res = await fetch(siteConfig.backend_url + '/api/tournaments',
		{ next: { revalidate: 30 }})
	if (!res.ok) {
		throw new Error('Failed to fetch data')
	}
	return await res.json()
}
