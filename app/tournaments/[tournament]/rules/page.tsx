import {Card, CardBody} from "@nextui-org/card";

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

export async function getTournamentRule(tournament_name: string): Promise<{ data: string }> {
    const res = await fetch('http://localhost:8421/api/tournament_rule?tournament_name=' + tournament_name,
        { next: { revalidate: 0 }})
    return await res.json()
}

