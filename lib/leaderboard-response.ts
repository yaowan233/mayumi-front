export type LeaderboardRow = Record<string, unknown>;

export function parseLeaderboardResponse(data: unknown): LeaderboardRow[] {
    // Older API deployments return null for team rounds without a leaderboard.
    if (data === null) return [];

    if (!Array.isArray(data)) {
        throw new Error("排行榜接口返回了无效的数据格式");
    }

    return data.filter(
        (item): item is LeaderboardRow =>
            typeof item === "object" && item !== null && !Array.isArray(item),
    );
}
