import {HomePage, TournamentInfo} from "@/components/homepage";
import {siteConfig} from "@/config/site";


export default async function TournamentHomePage({params}: { params: { tournament: string } }) {
    const info = await getTournamentInfo(params.tournament)
    return (
        <HomePage tournament_info={info}/>
    )
}

export async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}
