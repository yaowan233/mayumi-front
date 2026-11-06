"use client";
import React, {createContext, useCallback, useMemo} from "react";
import useSWR, {SWRConfig} from "swr";
import {usePathname} from "next/navigation";
import type {Me} from "@/app/actions";
import {siteConfig} from "@/config/site";
import {fetchCurrentUser} from "@/lib/client-api";

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);
const sessionCacheConfig = {provider: () => new Map()};

interface CurrentUserContextType {
    currentUser: Me | null;
    isLoading: boolean;
    error?: Error;
    setCurrentUser: React.Dispatch<React.SetStateAction<Me | null>>;
}

export function UserProvider({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    // Ticket credentials are cleared from the URL on first read. Account
    // resolution must never remount this independent, one-time form.
    if (pathname === "/config" || pathname?.startsWith("/config/")) return children;
    return <AccountUserProvider>{children}</AccountUserProvider>;
}

function AccountUserProvider({children}: {children: React.ReactNode}) {
    const {data, isLoading, error, mutate} = useSWR<Me | null, Error>(
        `${siteConfig.backend_url.replace(/\/$/, "")}/api/me`, fetchCurrentUser,
        {revalidateOnFocus: false, shouldRetryOnError: false},
    );
    const setCurrentUser = useCallback<CurrentUserContextType["setCurrentUser"]>(update => {
        void mutate(previous => typeof update === "function" ? update(previous ?? null) : update, {revalidate: false});
    }, [mutate]);
    const value = useMemo(() => ({currentUser: data ?? null, isLoading, error, setCurrentUser}), [data, isLoading, error, setCurrentUser]);
    // Reset cached data and page state when switching identities, including logout.
    const uid = data?.uid ?? "anonymous";
    return <CurrentUserContext.Provider value={value}>
        <SWRConfig key={uid} value={sessionCacheConfig}>{children}</SWRConfig>
    </CurrentUserContext.Provider>;
}

export default CurrentUserContext;
