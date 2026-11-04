"use client";

import {useParams} from "next/navigation";
import {ScheduleComp, ScheduleStage} from "@/components/schedule_comp";
import {useTournamentResource} from "@/lib/use_browser_resource";
import {ScheduleSkeleton} from "@/components/page_skeleton";
import {TournamentLoadError} from "@/components/tournament_load_error";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";

export default function SchedulePage() {
    const {tournament} = useParams<{tournament: string}>();
    const schedule = useTournamentResource<ScheduleStage[]>("/api/schedule");
    const players = useTournamentResource<TournamentPlayers>("/api/players");
    const error = schedule.error ?? players.error;
    if (error) return <TournamentLoadError error={error.message}/>;
    if (schedule.isLoading || players.isLoading) return <ScheduleSkeleton/>;
    return (
        <ScheduleComp tabs={schedule.data ?? []} tournament_name={tournament} tournamentPlayers={players.data ?? {players: []}}/>
    )
}
