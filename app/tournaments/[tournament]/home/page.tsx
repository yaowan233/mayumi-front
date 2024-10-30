import {HomePage, TournamentInfo} from "@/components/homepage";
import {siteConfig} from "@/config/site";


export default async function TournamentHomePage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const info = await getTournamentInfo(params.tournament)
    if (!info) {
        return <div className='text-center text-2xl font-bold'>没有这种比赛喵~</div>
    }
    return (
        <HomePage tournament_info={info}/>
    )
}

async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo | null> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        { next: { revalidate: 60 }})
    return await res.json()
}
