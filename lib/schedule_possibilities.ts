import {parseUtcDateTime} from "./datetime.ts";

export type ScheduleParticipant = {
    name: string;
    avatar_url: string;
    uid: number[];
};

export type PossibleSchedulePairing = {
    team1: string;
    team2: string;
    match_time?: string | null;
    team1_info?: ScheduleParticipant | null;
    team2_info?: ScheduleParticipant | null;
};

export function isScheduleVisible(schedule: {is_future_pending?: boolean; is_automatic_advance?: boolean}): boolean {
    return !schedule.is_future_pending && !schedule.is_automatic_advance;
}

type MatchPossibilities = {
    datetime: string | null;
    team1: ScheduleParticipant | null;
    team2: ScheduleParticipant | null;
    possible_pairings?: PossibleSchedulePairing[];
};

export function sortSchedulesByTime<T>(items: readonly T[], getTime: (item: T) => string | null | undefined): T[] {
    return [...items].sort((a, b) => {
        const aTime = parseUtcDateTime(getTime(a))?.getTime() ?? Infinity;
        const bTime = parseUtcDateTime(getTime(b))?.getTime() ?? Infinity;
        return aTime === bTime ? 0 : aTime < bTime ? -1 : 1;
    });
}

export function expandMatchPossibilities<T extends MatchPossibilities>(matches: T[]): T[] {
    const expanded = matches.flatMap(match => match.possible_pairings?.length
        ? match.possible_pairings.map((pair, index) => ({
            ...match,
            datetime: pair.match_time !== undefined ? pair.match_time : match.datetime,
            team1: pair.team1_info ?? (match.team1?.name === pair.team1 ? match.team1 : null),
            team2: pair.team2_info ?? (match.team2?.name === pair.team2 ? match.team2 : null),
            team1_placeholder: pair.team1,
            team2_placeholder: pair.team2,
            possibility_key: String(index),
        }))
        : [match]);
    return sortSchedulesByTime(expanded, match => match.datetime);
}
