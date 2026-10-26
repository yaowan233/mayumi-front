import type {Team} from "../app/tournaments/[tournament]/participants/page";

type Participant = {name: string; uid: number[]};
type Match = {
    team1: Participant | null;
    team2: Participant | null;
    has_recorded_result?: boolean;
    match_url?: string[] | null;
    team1_score?: number | null;
    team2_score?: number | null;
};

function hasRecordedResult(match: Match): boolean {
    return match.has_recorded_result === true || Boolean(match.match_url?.some(url => url.trim()))
        || (match.team1_score ?? 0) !== 0 || (match.team2_score ?? 0) !== 0;
}

function partition<T>(items: readonly T[], isMine: (item: T) => boolean) {
    const mine: T[] = [];
    const others: T[] = [];
    for (const item of items) (isMine(item) ? mine : others).push(item);
    return {mine, others};
}

export function partitionMyMatches<T extends Match>(matches: readonly T[], uid?: number, teams?: readonly Team[] | null) {
    // Public team participants contain captain UIDs, so use the verified roster
    // to recognize ordinary members as well.
    const myTeams = new Set((teams ?? []).filter(team => team.is_verified && uid !== undefined
        && [...team.captains, ...team.members].includes(uid)).map(team => team.name));
    return partition(matches, match => uid !== undefined && !hasRecordedResult(match) && [match.team1, match.team2].some(
        participant => participant && (participant.uid.includes(uid) || myTeams.has(participant.name)),
    ));
}
