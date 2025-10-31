import {MappoolsComponents, Stage} from "@/components/mappools";
import {siteConfig} from "@/config/site";


export default async function MapPollsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    let tabs: Stage[] = await getStages(params.tournament)
    return (
        <MappoolsComponents tabs={tabs}/>
    )
}


async function getStages(tournament_name: string): Promise<Stage[]> {
    const res = await fetch(siteConfig.backend_url + '/api/map_pools?tournament_name=' + tournament_name,
        {next: {revalidate: 60}})
    return await res.json()
}
