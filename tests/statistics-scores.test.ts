import assert from "node:assert/strict";
import test from "node:test";
import {buildPersonalRating, buildTeamMapScores, type RatingMatchContext, type StatisticsScore} from "../lib/statistics-scores.ts";

const time = "2026-11-03T06:00:00Z";
const score = (player: string, points: number, overrides: Partial<StatisticsScore> = {}): StatisticsScore => ({
    tournament_name: "Cup", stage_name: "RO16", map_id: 1, player, start_time: time,
    score: points, acc: 0.98, mod: ["NF"], ...overrides,
});
const teams = [
    {name: "A", captains: [1], members: [1, 2], is_verified: true},
    {name: "B", captains: [3], members: [4], is_verified: true},
];
const players = [1, 2, 3, 4].map(uid => ({uid, name: `Player ${uid}`}));
const maps = [{map_id: "1", mod: "NM", number: 1}, {map_id: "2", mod: "HD", number: 1}];

function contextFor(scores: StatisticsScore[], matchFor: (score: StatisticsScore) => string = () => "match"): RatingMatchContext {
    const links = scores.filter(s => s.stage_name === "RO16" && s.start_time && [1, 2, 3].includes(Number(s.map_id)) && Number.isFinite(s.score) && s.score >= 0)
        .map(s => ({player: s.player, map_id: s.map_id, start_time: s.start_time, match_id: matchFor(s), game_id: `${s.map_id}:${s.start_time}`}));
    const matches = new Map<string, Map<string, Set<string>>>();
    for (const link of links) {
        const players = matches.get(link.match_id) ?? new Map<string, Set<string>>();
        const games = players.get(link.player) ?? new Set<string>();
        games.add(link.game_id); players.set(link.player, games); matches.set(link.match_id, players);
    }
    return {links, matches: [...matches].map(([match_id, players]) => ({match_id,
        mean_maps_played: [...players.values()].reduce((sum, games) => sum + games.size, 0) / players.size}))};
}

const close = (actual: unknown, expected: number) => assert.ok(Math.abs(Number(actual) - expected) < 1e-12, `${actual} != ${expected}`);

test("team map ranking sums teammates from the same play, never their cross-play bests", () => {
    const later = "2026-11-03T07:00:00Z";
    const scores = [score("1", 100), score("2", 20), score("1", 10, {start_time: later}), score("2", 150, {start_time: later}),
        score("3", 90), score("4", 80)];
    const rows = buildTeamMapScores(scores, teams, "RO16", "1");
    assert.deepEqual(rows.map(row => [row.team.name, row.score]), [["B", 170], ["A", 160]]);
    assert.deepEqual(rows[1].members.map(member => [member.player, member.score]), [["2", 150], ["1", 10]]);
    assert.equal(rows[1].start_time, later);
    assert.equal(scores[0].score, 100);
});

test("team ranking filters the selected map and round and deduplicates players within a play", () => {
    const rows = buildTeamMapScores([score("1", 50), score("1", 90), score("2", 100), score("99", 10000),
        score("3", 20000, {map_id: 2}), score("3", 30000, {stage_name: "QF"})], teams, "RO16", 1);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].score, 190);
    assert.equal(rows[0].members.length, 2);
});

test("ambiguous, unverified or undated team scores are not added to a team total", () => {
    const entries = [...teams,
        {name: "Unverified", captains: [5], members: [], is_verified: false},
        {name: "Conflicting", captains: [1], members: [], is_verified: true}];
    const rows = buildTeamMapScores([score("1", 1000), score("2", 100), score("5", 1000),
        score("3", 1000, {start_time: ""}), score("4", -1), score("4", Infinity)], entries, "RO16", 1);
    assert.deepEqual(rows.map(row => [row.team.name, row.score]), [["A", 100]]);
    assert.deepEqual(buildTeamMapScores([], teams, "RO16", 1), []);
});

test("equal team scores retain both teams with deterministic ordering, including zero scores", () => {
    const rows = buildTeamMapScores([score("1", 0), score("3", 0)], teams, "RO16", 1);
    assert.deepEqual(rows.map(row => [row.team.name, row.score]), [["A", 0], ["B", 0]]);
});

test("median benchmark gives each player's per-map average one vote despite repeated appearances", () => {
    const data = [0, 1, 2, 3, 4].map(i => score("1", 100, {start_time: `play-${i}`}));
    data.push(score("2", 200), score("3", 300));
    const rows = buildPersonalRating(data, players, "RO16", maps, contextFor(data));
    close(rows.find(row => row.name === "Player 1")!.Rating, .5);
    close(rows.find(row => row.name === "Player 2")!.Rating, Math.cbrt(3 / 7));
    close(rows.find(row => row.name === "Player 3")!.Rating, 1.5 * Math.cbrt(3 / 7));
});

test("playing the same performance in a second match changes appearance count but not Rating", () => {
    const first = [score("1", 80), score("1", 40, {map_id: 2}), score("2", 100), score("2", 100, {map_id: 2})];
    const extra = [score("1", 80, {start_time: "second-match"}), score("1", 40, {map_id: 2, start_time: "second-match"})];
    const matchFor = (s: StatisticsScore) => s.start_time === "second-match" ? "second" : "first";
    const before = buildPersonalRating(first, players, "RO16", maps, contextFor(first, matchFor)).find(row => row.name === "Player 1")!;
    const after = buildPersonalRating([...first, ...extra], players, "RO16", maps, contextFor([...first, ...extra], matchFor)).find(row => row.name === "Player 1")!;
    close(before.Rating, Number(after.Rating));
    assert.equal(before["出场局数"], 2);
    assert.equal(after["出场局数"], 4);
    assert.equal(after["比赛场数"], 2);
});

test("a lower repeat score counts toward Rating and does not get replaced by the player's best", () => {
    const data = [score("1", 100), score("1", 50, {start_time: "second-play"}), score("2", 100)];
    const row = buildPersonalRating(data, players, "RO16", maps, contextFor(data)).find(row => row.name === "Player 1")!;
    close(row.Rating, 75 / 87.5);
    assert.equal(row["平均分数"], 75);
    assert.equal(row["NM 1 平均成绩"], 75);
    assert.equal(row["NM 1"], 2);
});

test("reimporting the same player/map/time never inflates their Rating or appearance count", () => {
    const data = [score("1", 80), score("1", 80), score("1", 60), score("2", 100), score("3", 100, {start_time: ""})];
    const rows = buildPersonalRating(data, players, "RO16", maps, contextFor(data));
    close(rows[0].Rating, 100 / 90); close(rows[1].Rating, 80 / 90);
    assert.deepEqual(rows.map(row => row["出场局数"]), [1, 1]);
});

test("personal map ranks use competition ties and Rating preserves close differences", () => {
    const data = [score("1", 1000000), score("2", 999999), score("3", 999999), score("4", 10)];
    const rows = buildPersonalRating(data, players, "RO16", maps, contextFor(data));
    assert.deepEqual(rows.map(row => row["NM 1"]), [1, 2, 2, 4]);
    assert.equal(rows[1].Rating, 1);
    assert.ok(Number(rows[0].Rating) > Number(rows[1].Rating));
});

test("zero personal scores produce finite Ratings and invalid or out-of-round scores are excluded", () => {
    const data = [score("1", 0), score("2", 0), score("3", NaN), score("4", -1)];
    const rows = buildPersonalRating(data, players, "RO16", maps, contextFor(data));
    assert.deepEqual(rows.map(row => [row.Rating, row["NM 1"]]), [[0, 1], [0, 1]]);
    assert.deepEqual(buildPersonalRating([], players, "RO16", maps), []);
    assert.deepEqual(buildPersonalRating([score("1", 10)], players, "QF", maps), []);
    assert.deepEqual(buildPersonalRating([score("1", 10)], players, "RO16", []), []);
});

test("attendance coefficient is capped at one and low participation is discounted", () => {
    const data = [0, 1, 2, 3].map(i => score("1", 100, {start_time: `play-${i}`}));
    data.push(score("2", 100));
    const rows = buildPersonalRating(data, players, "RO16", maps, contextFor(data));
    close(rows[0].Rating, 1);
    close(rows[1].Rating, Math.cbrt(1 / 2.5));
});

test("missing or ambiguous match links remain unranked rather than receiving an invented coefficient", () => {
    const data = [score("1", 100)];
    let rows = buildPersonalRating(data, players, "RO16", maps);
    assert.equal(rows[0].Rating, "-");
    assert.equal(rows[0]["状态"], "待关联");
    const context = contextFor(data);
    context.links.push({...context.links[0], match_id: "conflict"});
    rows = buildPersonalRating(data, players, "RO16", maps, context);
    assert.equal(rows[0].Rating, "-");
});

test("official ranking requires three distinct maps, not three replays of one map", () => {
    const data = [score("1", 100), score("1", 100, {map_id: 2}), score("1", 100, {map_id: 3}),
        score("2", 1000), score("2", 1000, {start_time: "replay-1"}), score("2", 1000, {start_time: "replay-2"})];
    const allMaps = [...maps, {map_id: 3, mod: "HR", number: 1}];
    const rows = buildPersonalRating(data, players, "RO16", allMaps, contextFor(data));
    assert.equal(rows[0].name, "Player 1");
    assert.equal(rows[0]["状态"], "正式");
    assert.equal(rows[1]["状态"], "暂定");
});
