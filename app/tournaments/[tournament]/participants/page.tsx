import {ParticipantsComp} from "@/components/participants_comp";
import {siteConfig} from "@/config/site";

export default async function ParticipantsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const tournament_players = await getPlayers(params.tournament, 60)
    tournament_players.groups = tournament_players.groups?.filter(group => group.is_verified)
    return (
        <ParticipantsComp tournament_players={tournament_players}/>
    )
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: revalidate_time }})
    return await res.json()
}


export interface TournamentPlayers {
    groups?: Team[];
    players: Player[];
}
export type Team = {
    tournament_name: string
    name: string
    captains: number[]
    members: number[]
    icon_url?: string
    is_verified: boolean
}

export type Player = {
    uid: number;
    name: string;
    tournament_name: string;
    pp: number;
    rank: number;
    country: string;
    group?: string;
    timezone?: string;
    player?: boolean;
    host?: boolean;
    referee?: boolean;
    streamer?: boolean;
    commentator?: boolean;
    mappooler?: boolean;
    custom_mapper?: boolean;
    donator?: boolean;
    graphic_designer?: boolean;
    scheduler?: boolean;
    map_tester?: boolean;
}
