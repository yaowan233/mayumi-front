import Image from "next/image";
import {Player} from "@/app/tournaments/[tournament]/participants/page";


export const UserInfo = ({user}: { user: Player }) => {
    return (
        <a className={"flex gap-3 justify-start border-2 p-2 text-foreground no-underline shadow-lg"}
           href={`https://osu.ppy.sh/u/${user.uid}`}
           target="_blank"
           rel="noopener noreferrer">
            <div className={"grid content-center px-2"}>
                <Image alt="icon" height={60} width={60} src={`https://a.ppy.sh/${user.uid}`}/>
            </div>
            <div className={"flex flex-col gap-3"}>
                <div>
                    <p className={"text-foreground"}>{user.name}</p>
                </div>
                <div className={"flex flex-row gap-x-3"}>
                    <div className={"border-t-3"}>
                        <p className={"text-foreground"}>世界排名</p>
                        <p className={"text-foreground"}>#{user.rank}</p>
                    </div>
                    <div className={"border-t-3"}>
                        <p className={"text-foreground"}>pp</p>
                        <p className={"text-foreground"}>{user.pp}</p>
                    </div>
                </div>
                {/*<div className={"border-t-3"}>*/}
                {/*    <p className={"text-foreground"}>时区</p>*/}
                {/*    <p className={"text-foreground"}>UTC{user.timezone}</p>*/}
                {/*</div>*/}
            </div>
        </a>
    )
}
