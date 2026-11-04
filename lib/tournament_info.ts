"use client";

import {useTournamentResource} from "@/lib/use_browser_resource";
import type {TournamentInfo} from "@/components/homepage";

export function useTournamentInfo() {
    return useTournamentResource<TournamentInfo>("/api/tournament-info");
}
