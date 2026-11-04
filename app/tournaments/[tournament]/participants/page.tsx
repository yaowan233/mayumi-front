"use client";

import {ParticipantsComp} from "@/components/participants_comp";
import {useTournamentResource} from "@/lib/use_browser_resource";
import {ParticipantsSkeleton} from "@/components/page_skeleton";
import {TournamentLoadError} from "@/components/tournament_load_error";

export default function ParticipantsPage() {
    const {data, error, isLoading} = useTournamentResource<TournamentPlayers>("/api/players");
    if (error) return <TournamentLoadError error={error.message}/>;
    if (isLoading) return <ParticipantsSkeleton/>;
    const tournament_players = {...(data ?? {players: []}), groups: data?.groups?.filter(group => group.is_verified)};
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
    default_mode?: string;
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
