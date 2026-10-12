export type SchedulePairing = {team1: string; team2: string; match_time?: string | null};
type ScheduleTimeOptions = {match_time?: string | null; possible_match_times?: SchedulePairing[] | null; possible_pairings?: SchedulePairing[]};

export function getPairingTime(schedule: ScheduleTimeOptions, pair: SchedulePairing): string | null {
    const option = schedule.possible_match_times?.find(item => item.team1 === pair.team1 && item.team2 === pair.team2);
    if (option) return option.match_time ?? null;
    return pair.match_time !== undefined ? pair.match_time : schedule.match_time ?? null;
}

export function setPairingTime<T extends ScheduleTimeOptions>(schedule: T, pair: SchedulePairing, time: string | null): T {
    const options = [...(schedule.possible_match_times ?? [])];
    for (const candidate of schedule.possible_pairings ?? []) {
        if (!options.some(item => item.team1 === candidate.team1 && item.team2 === candidate.team2)) {
            options.push({...candidate, match_time: getPairingTime(schedule, candidate)});
        }
    }
    return {
        ...schedule,
        possible_match_times: [
            ...options.filter(item => item.team1 !== pair.team1 || item.team2 !== pair.team2),
            {team1: pair.team1, team2: pair.team2, match_time: time},
        ],
    };
}
