import {ParticipantsComp} from "@/components/participants_comp";
import {getPlayers} from "@/lib/api";

export default async function ParticipantsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const tournament_players = await getPlayers(params.tournament, 60)
    tournament_players.groups = tournament_players.groups?.filter(group => group.is_verified)
    return (
        <ParticipantsComp tournament_players={tournament_players}/>
    )
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
