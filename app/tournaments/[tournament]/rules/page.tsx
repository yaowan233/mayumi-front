import {Card, CardBody} from "@nextui-org/card";

export default function TournamentRulesPage({ params }: { params: { tournament: string }}) {
    return (
        <Card>
            <CardBody>
                <h1>
                    规则
                </h1>
            </CardBody>
        </Card>
    )
}