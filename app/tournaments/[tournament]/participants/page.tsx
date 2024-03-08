import {Player} from "@/components/user_info";
import {ParticipantsComp} from "@/components/participants_comp";
import {siteConfig} from "@/config/site";

export default async function ParticipantsPage({params}: { params: { tournament: string } }) {
    const tournament_players = await getPlayers(params.tournament)
    return (
        <ParticipantsComp tournament_players={tournament_players}/>
    )
}

async function getPlayers(tournament_name: string): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: 60 }})
    return await res.json()
}


export interface TournamentPlayers {
    groups?: Team[];
    players?: Player[];
}
type Team = {
    tournament_name: string
    name: string
    captains: number[]
    members: number[]
    icon_url?: string
    is_verified: boolean
}
