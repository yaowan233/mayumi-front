import {Player} from "@/components/user_info";
import {ParticipantsComp} from "@/components/participants_comp";

export default async function ParticipantsPage({params}: { params: { tournament: string } }) {
    const players = await getPlayers(params.tournament)
    return (
        <ParticipantsComp players={players}/>
    )
}

export async function getPlayers(tournament_name: string): Promise<Player[]> {
    const res = await fetch('http://localhost:8421/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}
