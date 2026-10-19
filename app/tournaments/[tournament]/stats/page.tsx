import {StatsComp} from "@/components/stats_comp";
import {backendServerUrl} from "@/lib/backend_server";
import {Stage} from "@/components/mappools";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {cookies} from "next/headers";
import {TournamentLoadError} from "@/components/tournament_load_error";
import {readStatisticsResponse, StatisticsRequestError} from "@/lib/statistics-response";


export default async function StatsPage(props: {
    params: Promise<{ tournament: string }>;
    searchParams: Promise<{preview?: string | string[]}>;
}) {
    const [params, query] = await Promise.all([props.params, props.searchParams]);
    const previewValue = Array.isArray(query.preview) ? query.preview[0] : query.preview;
    const preview = previewValue === "1" || previewValue === "true";
    const uuid = preview ? (await cookies()).get("uuid")?.value : undefined;
    const cookieHeader = uuid ? `uuid=${encodeURIComponent(uuid)}` : undefined;
    const result = await Promise.all([
        getStats(params.tournament, preview, cookieHeader),
        getRoundInfo(params.tournament),
        getStages(params.tournament),
        getScores(params.tournament, preview, cookieHeader),
        getPlayers(params.tournament, 60),
    ]).then(
        data => ({data, error: null}),
        (error: unknown) => ({
            data: null,
            error: error instanceof StatisticsRequestError
                ? error.message
                : "统计数据加载失败，请稍后重试",
        }),
    );
    if (!result.data) {
        return <TournamentLoadError error={result.error ?? "统计数据加载失败，请稍后重试"} />;
    }
    const [stats, roundInfo, stage, scores, players] = result.data;

    return (
        <StatsComp
            stats={stats ?? []}
            roundInfo={roundInfo ?? []}
            stage={stage ?? []}
            scores={scores ?? []}
            players={players?.players ?? []}
            isTeamTournament={Array.isArray(players?.groups)}
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
    const response = await fetch(`${backendServerUrl()}${pathname}?${query}`, {
        cache: "no-store",
        headers: cookieHeader ? {Cookie: cookieHeader} : undefined,
    });
    return readStatisticsResponse<T>(response, `统计${preview ? "预览" : "数据"}`);
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
    const data = await fetch(backendServerUrl() + `/api/tournament-round-info?tournament_name=${encodeURIComponent(tournament_name)}`,
        {next: {revalidate: 0}});
    return readStatisticsResponse<TournamentRoundInfo[]>(data, "轮次信息");
}

interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}

async function getStages(tournament_name: string): Promise<Stage[]> {
    const res = await fetch(backendServerUrl() + '/api/map_pools?tournament_name=' + encodeURIComponent(tournament_name),
        {next: {revalidate: 0}})
    return readStatisticsResponse<Stage[]>(res, "图池")
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(backendServerUrl() + '/api/players?tournament_name=' + encodeURIComponent(tournament_name),
        {next: {revalidate: revalidate_time}})
    return readStatisticsResponse<TournamentPlayers>(res, "参赛成员")
}
