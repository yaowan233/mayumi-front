export interface TournamentDates {
    registration_start_time?: string | null;
    start_date: string;
    end_date: string;
}

export function registrationStartTimestamp(value?: string | null): number | null {
    if (!value) return null;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
}

export function getRegistrationState(tournament: TournamentDates, now = Date.now()): "upcoming" | "open" | "closed" {
    // Preserve the existing date-only registration cutoff.
    if (now >= Date.parse(tournament.start_date)) return "closed";
    const start = registrationStartTimestamp(tournament.registration_start_time);
    return start !== null && now < start ? "upcoming" : "open";
}

export function splitTournamentsByTime<T extends TournamentDates>(list: T[], now = Date.now()) {
    const sorted = [...list].sort((a, b) => Date.parse(b.start_date) - Date.parse(a.start_date));
    const upcoming: T[] = [], ongoing: T[] = [], finished: T[] = [];
    for (const tournament of sorted) {
        if (Date.parse(tournament.end_date) < now) finished.push(tournament);
        else if (getRegistrationState(tournament, now) === "upcoming") upcoming.push(tournament);
        else ongoing.push(tournament);
    }
    upcoming.sort((a, b) => registrationStartTimestamp(a.registration_start_time)! - registrationStartTimestamp(b.registration_start_time)!);
    return {upcoming, ongoing, finished};
}

export function registrationTimeError(tournament: TournamentDates): string | null {
    if (!Number.isFinite(Date.parse(tournament.start_date))) return "比赛开始时间格式无效";
    if (!tournament.registration_start_time) return null;
    const timestamp = registrationStartTimestamp(tournament.registration_start_time);
    if (timestamp === null) return "报名开始时间格式无效";
    if (timestamp >= Date.parse(tournament.start_date)) return "报名开始时间必须早于比赛开始时间";
    return null;
}
