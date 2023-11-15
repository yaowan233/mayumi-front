import NextLink from "next/link";
import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import {title, subtitle, description_container} from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import {Navbar} from "@/components/navbar";
import Image from "next/image";
import {TournamentComponent} from "@/components/tournament";

interface Tournament {
	name: string;
	description: string;
	start_date: string;
	end_date: string;
	pic_url: string;
}


export default async function Home() {
	let tournaments_data = await GetTournamentInfo()
	return (
		<>
			<Navbar/>
			{/*展示TournamentInfo图片*/}
			<div className="container flex mx-auto justify-center">
			<h1 className={title()}> 正在进行中的比赛  </h1>
			</div>
			<div className="container mx-auto max-w-7xl pt-4 px-6 flex-grow">
				<div className="flex flex-wrap items-center justify-center gap-2">
					{tournaments_data.map((tournament) => (
						<TournamentComponent {...tournament} />
					))}
				</div>
			</div>
			{/*<Navbar/>*/}
			{/*<main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">*/}
			{/*	<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">*/}
			{/*		<div className="inline-block max-w-lg text-center justify-center">*/}
			{/*			<h1 className={title()}>Make&nbsp;</h1>*/}
			{/*			<h1 className={title({color: "violet"})}>beautiful&nbsp;</h1>*/}
			{/*			<br/>*/}
			{/*			<h1 className={title()}>*/}
			{/*				websites regardless of your design experience.*/}
			{/*			</h1>*/}
			{/*			<h2 className={subtitle({class: "mt-4"})}>*/}
			{/*				Beautiful, fast and modern React UI library.*/}
			{/*			</h2>*/}
			{/*		</div>*/}

			{/*		<div className="flex gap-3">*/}
			{/*			<Link*/}
			{/*				isExternal*/}
			{/*				as={NextLink}*/}
			{/*				href={siteConfig.links.docs}*/}
			{/*				className={buttonStyles({color: "primary", radius: "full", variant: "shadow"})}*/}
			{/*			>*/}
			{/*				Documentation*/}
			{/*			</Link>*/}
			{/*			<Link*/}
			{/*				isExternal*/}
			{/*				as={NextLink}*/}
			{/*				className={buttonStyles({variant: "bordered", radius: "full"})}*/}
			{/*				href={siteConfig.links.github}*/}
			{/*			>*/}
			{/*				<GithubIcon size={20}/>*/}
			{/*				GitHub*/}
			{/*			</Link>*/}
			{/*		</div>*/}
			{/*	</section>*/}
			{/*</main>*/}
		</>
	);
}


async function GetTournamentInfo() : Promise<Tournament[]> {
	const res = await fetch('http://127.0.0.1:8421/api/tournament_info',
		{ next: { revalidate: 600 }})
	if (!res.ok) {
		throw new Error('Failed to fetch data')
	}
	return await res.json()
}
