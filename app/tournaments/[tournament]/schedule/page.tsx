import {ScheduleComp, ScheduleStage} from "@/components/schedule_comp";
import {siteConfig} from "@/config/site";

export default async function SchedulePage({ params }: { params: { tournament: string }}) {
    let tabs: ScheduleStage[] = await getSchedule(params.tournament)
    return (
        <ScheduleComp tabs={tabs} tournament_name={params.tournament}/>
    )
}

async function getSchedule(tournament_name: string): Promise<ScheduleStage[]> {
    const res = await fetch(siteConfig.backend_url + '/api/schedule?tournament_name=' + tournament_name,
        { next: { revalidate: 10 }})
    return await res.json()
}
