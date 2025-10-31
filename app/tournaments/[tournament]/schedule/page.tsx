import {ScheduleComp, ScheduleStage} from "@/components/schedule_comp";
import {siteConfig} from "@/config/site";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {getPlayers} from "@/lib/api";

export default async function SchedulePage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const [tabs, tournamentPlayers] = await Promise.all([
        getSchedule(params.tournament),
        getPlayers(params.tournament, 3),
    ]);
    return (
        <ScheduleComp tabs={tabs} tournament_name={params.tournament} tournamentPlayers={tournamentPlayers}/>
    )
}

async function getSchedule(tournament_name: string): Promise<ScheduleStage[]> {
    const res = await fetch(siteConfig.backend_url + '/api/schedule?tournament_name=' + tournament_name,
        {next: {revalidate: 3}})
    return await res.json()
}
