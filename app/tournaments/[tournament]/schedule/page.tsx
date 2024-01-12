import {ScheduleComp, ScheduleStage} from "@/components/schedule_comp";

export default async function SchedulePage({ params }: { params: { tournament: string }}) {
    let tabs: ScheduleStage[] = await getSchedule(params.tournament)
    return (
        <ScheduleComp tabs={tabs}/>
    )
}

export async function getSchedule(tournament_name: string): Promise<ScheduleStage[]> {
    const res = await fetch('http://localhost:8421/api/schedule?tournament_name=' + tournament_name,
        { next: { revalidate: 10 }})
    return await res.json()
}
