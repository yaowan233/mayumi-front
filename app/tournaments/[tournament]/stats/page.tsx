import {StatsComp} from "@/components/stats_comp";
import {siteConfig} from "@/config/site";
import {Stage} from "@/components/mappools";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {cookies} from "next/headers";


export default async function StatsPage(props: {
    params: Promise<{ tournament: string }>;
    searchParams: Promise<{preview?: string | string[]}>;
}) {
    const [params, query] = await Promise.all([props.params, props.searchParams]);
    const previewValue = Array.isArray(query.preview) ? query.preview[0] : query.preview;
    const preview = previewValue === "1" || previewValue === "true";
    const uuid = preview ? (await cookies()).get("uuid")?.value : undefined;
    const cookieHeader = uuid ? `uuid=${encodeURIComponent(uuid)}` : undefined;
    const [stats, roundInfo, stage, scores, players] = await Promise.all([
        getStats(params.tournament, preview, cookieHeader),
        getRoundInfo(params.tournament),
        getStages(params.tournament),
        getScores(params.tournament, preview, cookieHeader),
        getPlayers(params.tournament, 60),
    ]);

    return (
        <StatsComp
            stats={stats ?? []}
            roundInfo={roundInfo ?? []}
            stage={stage ?? []}
            scores={scores ?? []}
            players={players?.players ?? []}
            preview={preview}
        />
    );
}

async function getStats(
    tournamentName: string,
    preview: boolean,
    cookieHeader?: string,
): Promise<Stats[]> {
    return getPrivateStatisticsResource<Stats[]>(
        "/api/stats",
        tournamentName,
        preview,
        cookieHeader,
    );
}


async function getScores(
    tournamentName: string,
    preview: boolean,
    cookieHeader?: string,
): Promise<Score[]> {
    return getPrivateStatisticsResource<Score[]>(
        "/api/scores",
        tournamentName,
        preview,
        cookieHeader,
    );
}

async function getPrivateStatisticsResource<T>(
    pathname: string,
    tournamentName: string,
    preview: boolean,
    cookieHeader?: string,
): Promise<T> {
    const query = new URLSearchParams({tournament_name: tournamentName});
    if (preview) query.set("preview", "true");
    const response = await fetch(`${siteConfig.backend_url}${pathname}?${query}`, {
        cache: "no-store",
        headers: cookieHeader ? {Cookie: cookieHeader} : undefined,
    });
    if (!response.ok) {
        throw new Error(`统计${preview ? "预览" : ""}请求失败 (${response.status})`);
    }
    return response.json();
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

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 0}});
    return await data.json();
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
        {next: {revalidate: 0}})
    return await res.json()
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: revalidate_time}})
    return await res.json()
}
