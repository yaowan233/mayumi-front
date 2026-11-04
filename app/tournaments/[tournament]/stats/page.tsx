"use client";

import {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {StatsComp} from "@/components/stats_comp";
import type {Stage} from "@/components/mappools";
import type {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {TournamentLoadError} from "@/components/tournament_load_error";
import {StatsSkeleton} from "@/components/page_skeleton";
import {useTournamentResource} from "@/lib/use_browser_resource";
import type {StatisticsScore as Score} from "@/lib/statistics-scores";

export default function StatsPage() {
    return <Suspense fallback={<StatsSkeleton/>}><StatisticsContent/></Suspense>;
}

function StatisticsContent() {
    const searchParams = useSearchParams();
    const previewValue = searchParams.get("preview");
    const preview = previewValue === "1" || previewValue === "true";
    const query = preview ? {preview: "true"} : undefined;
    const stats = useTournamentResource<Stats[]>("/api/stats", query);
    const rounds = useTournamentResource<TournamentRoundInfo[]>("/api/tournament-round-info");
    const stages = useTournamentResource<Stage[]>("/api/map_pools");
    const scores = useTournamentResource<Score[]>("/api/scores", query);
    const players = useTournamentResource<TournamentPlayers>("/api/players");
    const requests = [stats, rounds, stages, scores, players];
    const error = requests.find(request => request.error)?.error;
    if (error) return <TournamentLoadError error={error.message}/>;
    if (requests.some(request => request.isLoading)) return <StatsSkeleton/>;

    return <StatsComp
        stats={stats.data ?? []}
        roundInfo={rounds.data ?? []}
        stage={stages.data ?? []}
        scores={scores.data ?? []}
        players={players.data?.players ?? []}
        teams={players.data?.groups ?? []}
        isTeamTournament={Array.isArray(players.data?.groups)}
        preview={preview}
    />;
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

interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}
