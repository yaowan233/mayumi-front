import {getStages} from "@/app/tournaments/[tournament]/mappools/page";
import {getPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {StatsComp} from "@/components/stats_comp";


export default async function StatsPage({params}: { params: { tournament: string } }) {
    const stats = await getStats(params.tournament);
    const roundInfo = await getRoundInfo(params.tournament);
    const stage = await getStages(params.tournament);
    const scores = await getScores(params.tournament);
    const players = await getPlayers(params.tournament);

    return (
        <StatsComp stats={stats} roundInfo={roundInfo} stage={stage} scores={scores} players={players}/>
    );
}

async function getStats(tournament_name: string): Promise<Stats[]> {
    const res = await fetch('http://localhost:8421/api/stats?tournament_name=' + tournament_name,
        {next: {revalidate: 10}});
    return await res.json();
}


async function getScores(tournament_name: string): Promise<Score[]> {
    const res = await fetch('http://localhost:8421/api/scores?tournament_name=' + tournament_name,
        {next: {revalidate: 10}});
    return await res.json();
}


interface Stats {
    stage_name: string;
    mod_name: string;
    score_max?: number;
    score_min?: number;
    score_avg?: number;
    acc_max?: number;
    acc_min?: number;
    acc_avg?: number;
    miss_max?: number;
    miss_min?: number;
    miss_avg?: number;
}

interface Score {
    tournament_name: string;
    stage_name: string;
    map_id: string;
    player: string;
    score: number;
    acc: number;
}
export async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(`http://localhost:8421/api/tournament-round-info?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 }});
    return await data.json();
}

interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}
