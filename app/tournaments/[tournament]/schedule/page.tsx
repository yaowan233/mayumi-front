import {ScheduleComp, ScheduleStage} from "@/components/schedule_comp";
import {backendServerUrl} from "@/lib/backend_server";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";

export default async function SchedulePage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const [tabs, tournamentPlayers] = await Promise.all([
        getSchedule(params.tournament),
        getPlayers(params.tournament),
    ]);
    return (
        <ScheduleComp tabs={tabs} tournament_name={params.tournament} tournamentPlayers={tournamentPlayers}/>
    )
}

async function getSchedule(tournament_name: string): Promise<ScheduleStage[]> {
    const res = await fetch(backendServerUrl() + '/api/schedule?tournament_name=' + tournament_name,
        {next: {revalidate: 0}})
    return await res.json()
}

async function getPlayers(tournament_name: string): Promise<TournamentPlayers> {
    const res = await fetch(backendServerUrl() + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: 0}})
    return await res.json()
}
