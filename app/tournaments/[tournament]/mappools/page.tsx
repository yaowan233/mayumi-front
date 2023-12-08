import {MappoolsComponents, Stage} from "@/components/mappools";


export default async function MapPollsPage({params}: { params: { tournament: string } }) {
    let tabs: Stage[] = await getStages(params.tournament)
    return (
        <MappoolsComponents {...{items: tabs}}/>
    )
}


export async function getStages(tournament_name: string): Promise<Stage[]> {
    const res = await fetch('http://localhost:8421/api/map_pools?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}
