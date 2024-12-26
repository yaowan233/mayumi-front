import { siteConfig } from "@/config/site";
import {title} from "@/components/primitives";
import {Navbar} from "@/components/navbar";
import {TournamentComponent} from "@/components/tournament_pic";
import {Tournament} from "@/components/tournament_pic";


export default async function Home() {
	let tournaments_data = await GetTournamentInfo()
	tournaments_data = tournaments_data.sort((a, b) => {
		return new Date(a.start_date) < new Date(b.start_date) ? 1 : -1
	})
	return (
		<>
			<Navbar/>
			{/*展示TournamentInfo图片*/}
			<div className="flex flex-col gap-2">
				<div className="w-full flex mx-auto justify-center">
				<h1 className={title()}>正在进行中的比赛</h1>
				</div>
				<div className="w-full mx-auto pt-4 px-6 flex-grow">
					<div className="w-full flex flex-wrap items-center justify-center gap-2">
						{tournaments_data.filter((tournament) => (
							new Date(tournament.end_date) >= new Date()
						)).map((tournament) => (
							<TournamentComponent key={tournament.name} tournament={tournament} />
						))}
					</div>
				</div>
				<div className="w-full flex mx-auto justify-center">
					<h1 className={title()}>已结束的比赛</h1>
				</div>
				<div className="w-full mx-auto pt-4 px-6 flex-grow">
					<div className="flex flex-wrap items-center justify-center gap-2">
						{tournaments_data.filter((tournament) => (
							new Date(tournament.end_date) < new Date()
						)).map((tournament) => (
							<TournamentComponent key={tournament.name} tournament={tournament} />
						))}
					</div>
				</div>
			</div>
		</>
	);
}


async function GetTournamentInfo() : Promise<Tournament[]> {
	const res = await fetch(siteConfig.backend_url + '/api/tournaments',
		{ next: { revalidate: 60 }})
	if (!res.ok) {
		throw new Error('Failed to fetch data')
	}
	return await res.json()
}
