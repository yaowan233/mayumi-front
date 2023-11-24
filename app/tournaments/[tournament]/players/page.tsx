import {Card, CardBody} from "@nextui-org/card";
import {Image} from "@nextui-org/image";

export default function PlayersPage({ params }: { params: { tournament: string }}) {
    return (
        <div className={"grid md:grid-cols-4 sm:grid-cols-3 gap-3"}>
            <div className={"flex gap-3 justify-start border-2"}>
                <div className={"grid content-center px-2"}>
                    <Image height={60} width={60} src={'https://a.ppy.sh/3162675'}/>
                </div>
                <div className={"flex-col"}>
                    <div>
                        <p className={"text-foreground"}>Player Name</p>
                    </div>
                    <div className={"flex flex-row gap-x-3"}>
                        <div className={"border-t-3"}>
                            <p className={"text-foreground"}>世界排名</p>
                            <p className={"text-foreground"}>#123</p>
                        </div>
                        <div className={"border-t-3"}>
                            <p className={"text-foreground"}>pp</p>
                            <p className={"text-foreground"}>12345</p>
                        </div>
                    </div>
                    <div className={"border-t-3"}>
                        <p className={"text-foreground"}>时区</p>
                        <p className={"text-foreground"}>UTC+8</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
