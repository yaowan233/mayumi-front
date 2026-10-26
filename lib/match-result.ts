export type MatchResultDetails = {
    version: string; match_urls: string[]; teams: (string | null)[]; scores: number[];
    can_calculate: boolean; best_of: number | null;
};
export type ResultGame = {
    id: string; room_id: string; beatmap_id: number; ended_at: string | null;
    scores: number[]; players: number[]; winner: number | null; eligible: boolean;
    reason: string | null; note?: string; selected: boolean;
};
export type ResultPreview = MatchResultDetails & {games: ResultGame[]; preview_version: string};

export function canEditMatchResult(uid: number | undefined, role: {host?: boolean | null; scheduler?: boolean | null; referee?: boolean | null} | undefined,
                                   referees?: readonly {uid: number[]}[] | null): boolean {
    return uid !== undefined && (uid === 3162675 || Boolean(role && (role.host || role.scheduler || (role.referee && referees?.some(ref => ref.uid.includes(uid))))));
}

export function selectedResultScores(games: readonly ResultGame[], selected: readonly string[]): [number, number] {
    const ids = new Set(selected);
    const scores: [number, number] = [0, 0];
    for (const game of games) if (ids.has(game.id) && game.eligible && (game.winner === 0 || game.winner === 1)) scores[game.winner]++;
    return scores;
}
