import {Card, CardBody} from "@nextui-org/card";
import {Image} from "@nextui-org/image";

export default function PlayersPage({ params }: { params: { tournament: string }}) {
    return (
        <div className={"grid gridcols-4 gap-3 "}>
            <div className={"flex gap-3 justify-start"}>
                <div className={"justify-center"}>
                    <Image height={60} width={60} src={'https://a.ppy.sh/3162675'}/>
                </div>
                <div className={""}>

                </div>
            </div>
        </div>
    )
}