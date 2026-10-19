type Round = {stage_name: string};
type RoundStatistics = Round & {score_max?: number | null};

export function getStatisticsRoundSelection<T extends Round>(
    rounds: readonly T[],
    stats: readonly RoundStatistics[],
    scores: readonly Round[],
    requestedStage?: string | null,
) {
    const stagesWithScores = new Set(scores.map(score => score.stage_name));
    for (const row of stats) {
        // The stats API also returns mappool placeholders with null metrics.
        if (typeof row.score_max === "number" && Number.isFinite(row.score_max)) {
            stagesWithScores.add(row.stage_name);
        }
    }
    const visibleRounds = rounds.filter(round => stagesWithScores.has(round.stage_name));
    const currentRound = visibleRounds.find(round => round.stage_name === requestedStage)
        ?? visibleRounds.at(-1);

    return {visibleRounds, currentRound};
}
