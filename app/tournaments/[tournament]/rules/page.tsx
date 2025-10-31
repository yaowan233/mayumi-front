import {Card, CardBody} from "@heroui/card";
import {siteConfig} from "@/config/site";

export default async function TournamentRulesPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
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
        {next: {revalidate: 60}})
    return await res.json()
}

