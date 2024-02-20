import {Player} from "@/components/user_info";
import {ParticipantsComp} from "@/components/participants_comp";
import {siteConfig} from "@/config/site";

export default async function ParticipantsPage({params}: { params: { tournament: string } }) {
    const players = await getPlayers(params.tournament)
    return (
        <ParticipantsComp players={players}/>
    )
}

async function getPlayers(tournament_name: string): Promise<Player[]> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: 60 }})
    return await res.json()
}
