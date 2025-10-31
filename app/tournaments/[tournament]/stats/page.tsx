import {StatsComp} from "@/components/stats_comp";
import {siteConfig} from "@/config/site";
import {Stage} from "@/components/mappools";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {getPlayers, getRoundInfo} from "@/lib/api";


export default async function StatsPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    const stats = await getStats(params.tournament);
    const roundInfo = await getRoundInfo(params.tournament, 60);
    const stage = await getStages(params.tournament);
    const scores = await getScores(params.tournament);
    const players = await getPlayers(params.tournament, 60);

    return (
        <StatsComp stats={stats} roundInfo={roundInfo} stage={stage} scores={scores} players={players.players}/>
    );
}

async function getStats(tournament_name: string): Promise<Stats[]> {
    const res = await fetch(siteConfig.backend_url + '/api/stats?tournament_name=' + tournament_name,
        {next: {revalidate: 60}});
    return await res.json();
}


async function getScores(tournament_name: string): Promise<Score[]> {
    const res = await fetch(siteConfig.backend_url + '/api/scores?tournament_name=' + tournament_name,
        {next: {revalidate: 60}});
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
    mod: string[];
}

interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}

async function getStages(tournament_name: string): Promise<Stage[]> {
    const res = await fetch(siteConfig.backend_url + '/api/map_pools?tournament_name=' + tournament_name,
        {next: {revalidate: 60}})
    return await res.json()
}
