import {MappoolsComponents, Stage} from "@/components/mappools";
import {siteConfig} from "@/config/site";


export default async function MapPollsPage({params}: { params: { tournament: string } }) {
    let tabs: Stage[] = await getStages(params.tournament)
    return (
        <MappoolsComponents tabs={tabs}/>
    )
}


export async function getStages(tournament_name: string): Promise<Stage[]> {
    const res = await fetch(siteConfig.backend_url + '/api/map_pools?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}
