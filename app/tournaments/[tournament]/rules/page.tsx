import {Card, CardBody} from "@nextui-org/card";
import {siteConfig} from "@/config/site";

export default async function TournamentRulesPage({params}: { params: { tournament: string } }) {
    const info = await getTournamentRule(params.tournament)
    return (
        <Card>
            <CardBody className={"whitespace-pre-wrap"}>
                {info.data}
            </CardBody>
        </Card>
    )
}

async function getTournamentRule(tournament_name: string): Promise<{ data: string }> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament_rule?tournament_name=' + tournament_name,
        { next: { revalidate: 60 }})
    return await res.json()
}

