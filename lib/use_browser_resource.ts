"use client";

import {useContext} from "react";
import {useParams} from "next/navigation";
import useSWR from "swr";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {browserResourceKey, fetchBrowserJson} from "@/lib/client-api";

export function useBrowserResource<T>(path: string, loader?: () => Promise<T>) {
    const session = useContext(CurrentUserContext);
    const url = `${siteConfig.backend_url.replace(/\/$/, "")}${path}`;
    const waitingForSession = session?.isLoading ?? true;
    const result = useSWR<T, Error>(
        browserResourceKey(url, session?.currentUser?.uid, waitingForSession),
        () => loader ? loader() : fetchBrowserJson<T>(url),
        {revalidateOnFocus: false, dedupingInterval: 60_000, shouldRetryOnError: false},
    );
    return {...result, isLoading: waitingForSession || result.isLoading};
}

export function useTournamentResource<T>(endpoint: string, query?: Record<string, string>) {
    const {tournament} = useParams<{tournament: string}>();
    const params = new URLSearchParams({tournament_name: tournament, ...query});
    return useBrowserResource<T>(`${endpoint}?${params}`);
}
