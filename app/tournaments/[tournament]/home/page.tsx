import {HomePage, TournamentInfo} from "@/components/homepage";


export default async function TournamentHomePage({params}: { params: { tournament: string } }) {
    const info = await getTournamentInfo(params.tournament)
    return (
        <HomePage tournament_info={info}/>
    )
}

export async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch('http://localhost:8421/api/tournament-info?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}
