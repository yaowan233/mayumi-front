"use client";

import {useSyncExternalStore} from "react";
import {formatLocalDateTime, formatUtcDateTime} from "@/lib/datetime";

const subscribe = () => () => {};

export function TournamentTime({value}: {value?: string | null}) {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    return <time dateTime={value ?? undefined} title={formatUtcDateTime(value) ?? undefined}>
        {mounted ? formatLocalDateTime(value, {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short",
        }) ?? "--" : "--"}
    </time>;
}
