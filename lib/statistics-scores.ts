export interface StatisticsScore {
    tournament_name: string;
    stage_name: string;
    map_id: string | number;
    player: string;
    start_time: string;
    score: number;
    acc: number;
    mod: string[];
}

type ScoreTeam = {name: string; captains: number[]; members: number[]; icon_url?: string; is_verified: boolean};
type RatingMap = {map_id: string | number; mod: string; number: string | number};

export type RatingMatchContext = {
    links: {player: string; map_id: string | number; start_time: string; match_id: string; game_id: string}[];
    matches: {match_id: string; mean_maps_played: number}[];
};

export const MIN_RATING_MAPS = 3;
export const ratingStatusOrder = (status: unknown): number => status === "正式" ? 0 : status === "暂定" ? 1 : 2;

const scoreKey = (score: {player: string; map_id: string | number; start_time: string}) =>
    JSON.stringify([String(score.player), String(score.map_id), score.start_time]);

export type TeamMapScore = {
    team: ScoreTeam;
    score: number;
    start_time: string;
    members: StatisticsScore[];
};

// Stored MP scores identify a play by its map and timestamp. Sum one score per
// teammate within that play, then retain the team's best recorded play.
export function buildTeamMapScores(
    scores: readonly StatisticsScore[], teams: readonly ScoreTeam[], stageName: string, mapId: string | number,
): TeamMapScore[] {
    const playerTeams = new Map<string, Set<ScoreTeam>>();
    for (const team of teams.filter(team => team.is_verified)) {
        for (const uid of new Set([...team.captains, ...team.members])) {
            const memberships = playerTeams.get(String(uid)) ?? new Set<ScoreTeam>();
            memberships.add(team);
            playerTeams.set(String(uid), memberships);
        }
    }
    const plays = new Map<ScoreTeam, Map<string, Map<string, StatisticsScore>>>();
    for (const score of scores) {
        if (score.stage_name !== stageName || String(score.map_id) !== String(mapId)
            || !score.start_time || !Number.isFinite(score.score) || score.score < 0) continue;
        const memberships = playerTeams.get(String(score.player));
        if (memberships?.size !== 1) continue;
        const team = [...memberships][0];
        const teamPlays = plays.get(team) ?? new Map<string, Map<string, StatisticsScore>>();
        const members = teamPlays.get(score.start_time) ?? new Map<string, StatisticsScore>();
        const previous = members.get(String(score.player));
        if (!previous || score.score > previous.score) members.set(String(score.player), score);
        teamPlays.set(score.start_time, members);
        plays.set(team, teamPlays);
    }
    const result: TeamMapScore[] = [];
    for (const [team, teamPlays] of plays) {
        let best: TeamMapScore | undefined;
        for (const [start_time, players] of teamPlays) {
            const members = [...players.values()].sort((a, b) => b.score - a.score || a.player.localeCompare(b.player));
            const score = members.reduce((sum, player) => sum + player.score, 0);
            if (!best || score > best.score || (score === best.score && start_time > best.start_time)) {
                best = {team, score, start_time, members};
            }
        }
        if (best) result.push(best);
    }
    return result.sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name));
}

export function buildPersonalRating(
    scores: readonly StatisticsScore[], players: readonly {uid: number; name: string}[],
    stageName: string, maps: readonly RatingMap[], context: RatingMatchContext = {links: [], matches: []},
    minimumMaps = MIN_RATING_MAPS,
): Record<string, string | number>[] {
    const mapIds = new Set(maps.map(map => String(map.map_id)));
    const names = new Map(players.map(player => [String(player.uid), player.name]));
    const plays = new Map<string, Map<string, Map<string, number>>>();
    for (const score of scores) {
        const mapId = String(score.map_id);
        if (score.stage_name !== stageName || !mapIds.has(mapId) || !score.start_time
            || !Number.isFinite(score.score) || score.score < 0) continue;
        const player = String(score.player);
        const values = plays.get(player) ?? new Map<string, Map<string, number>>();
        const attempts = values.get(mapId) ?? new Map<string, number>();
        // A repeated import of the same player/map/time is one appearance.
        attempts.set(score.start_time, Math.max(attempts.get(score.start_time) ?? 0, score.score));
        values.set(mapId, attempts);
        plays.set(player, values);
    }
    const averages = new Map<string, Map<string, number>>();
    const mapAverages = new Map<string, number[]>();
    for (const [player, values] of plays) {
        const playerAverages = new Map<string, number>();
        for (const [mapId, attempts] of values) {
            let sum = 0;
            for (const score of attempts.values()) {
                sum += score;
            }
            const average = sum / attempts.size;
            playerAverages.set(mapId, average);
            const ranked = mapAverages.get(mapId) ?? [];
            ranked.push(average);
            mapAverages.set(mapId, ranked);
        }
        averages.set(player, playerAverages);
    }
    for (const values of mapAverages.values()) values.sort((a, b) => b - a);
    const medians = new Map([...mapAverages].map(([map, values]) => {
        const middle = Math.floor(values.length / 2);
        return [map, values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2];
    }));
    const links = new Map<string, RatingMatchContext["links"][number]>();
    const ambiguous = new Set<string>();
    for (const link of context.links) {
        const key = scoreKey(link), previous = links.get(key);
        if (previous && (previous.match_id !== link.match_id || previous.game_id !== link.game_id)) ambiguous.add(key);
        links.set(key, link);
    }
    const matchMeans = new Map(context.matches.map(match => [match.match_id, match.mean_maps_played]));
    const rows = [];
    for (const [player, values] of plays) {
        const playerAverages = averages.get(player)!;
        let count = 0, sumRank = 0, sumScore = 0;
        let associated = true;
        const playedMatches = new Set<string>();
        for (const [mapId, attempts] of values) {
            for (const [start_time, score] of attempts) {
                sumScore += score;
                count++;
                const key = scoreKey({player, map_id: mapId, start_time}), link = links.get(key);
                const mean = link && matchMeans.get(link.match_id);
                if (!link || ambiguous.has(key) || typeof mean !== "number" || !Number.isFinite(mean) || mean <= 0) associated = false;
                else playedMatches.add(link.match_id);
            }
            sumRank += mapAverages.get(mapId)!.indexOf(playerAverages.get(mapId)!) + 1;
        }
        let performance = 0;
        for (const [mapId, attempts] of values) {
            const median = medians.get(mapId)!;
            // An all-zero reference carries no usable relative performance.
            if (median > 0) performance += (playerAverages.get(mapId)! / median) * (attempts.size / count);
        }
        const expectedMaps = [...playedMatches].reduce((sum, match) => sum + matchMeans.get(match)!, 0);
        const attendance = associated && expectedMaps > 0 ? Math.min(1, Math.cbrt(count / expectedMaps)) : null;
        const row: Record<string, string | number> = {
            name: names.get(player) ?? player,
            Rating: attendance === null ? "-" : performance * attendance,
            "状态": attendance === null ? "待关联" : values.size < minimumMaps ? "暂定" : "正式",
            "出场局数": count,
            "比赛场数": attendance === null ? "-" : playedMatches.size,
            "平均排名": Number((sumRank / values.size).toFixed(2)),
            "平均分数": Math.round(sumScore / count),
        };
        for (const map of maps) {
            const id = String(map.map_id), ranked = mapAverages.get(id);
            if (!ranked) continue;
            const label = `${map.mod} ${map.number}`, score = playerAverages.get(id);
            row[label] = score === undefined ? "-" : ranked.indexOf(score) + 1;
            row[`${label} 平均成绩`] = score === undefined ? "-" : Math.round(score);
        }
        rows.push(row);
    }
    return rows.sort((a, b) => ratingStatusOrder(a["状态"]) - ratingStatusOrder(b["状态"]) || Number(b.Rating) - Number(a.Rating)
        || Number(a["平均排名"]) - Number(b["平均排名"]) || String(a.name).localeCompare(String(b.name)));
}
