import {HomePage, TournamentInfo} from "@/components/homepage";
import {getTournamentInfo} from "@/lib/api";


export default async function TournamentHomePage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const info = await getTournamentInfo(params.tournament)
    if (!info) {
        return <div className='text-center text-2xl font-bold'>没有这种比赛喵~</div>
    }
    return (
        <HomePage tournament_info={info}/>
    )
}
