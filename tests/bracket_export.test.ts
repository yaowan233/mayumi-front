import assert from "node:assert/strict";
import test from "node:test";
import {calculateBracketBestOf, generateBracket, getBracketEntrants, getDefaultBracketAcronyms, type BracketExportInput} from "../lib/bracket_export.ts";

function fixture(): BracketExportInput {
    return {
        meta: {mode: "mania", is_group: true, start_date: "2026-09-01"},
        participants: {
            players: [1, 2, 3].map((uid) => ({uid, name: `Player ${uid}`, tournament_name: "Cup", pp: 100, rank: 10, country: "CN", player: uid !== 3})),
            groups: [
                {name: "队伍 A", tournament_name: "Cup", captains: [1], members: [1], is_verified: true},
                {name: "队伍 B", tournament_name: "Cup", captains: [2], members: [], is_verified: true},
                {name: "Hidden", tournament_name: "Cup", captains: [3], members: [], is_verified: false},
            ],
        },
        rounds: [{stage_name: "Final", start_time: "2026-09-10", is_lobby: false}],
        maps: Array.from({length: 13}, (_, index) => ({tournament_name: "Cup", stage_name: "Final", map_id: 100 + index, mod: "NM", number: 13 - index, mode: "mania"})),
        schedules: [{match_id: "uuid-1", stage_name: "Final", is_lobby: false, is_winner_bracket: true, match_time: "2026-09-10T20:00:00+08:00", team1: "队伍 A", team2: "队伍 B", team1_score: 6, team2_score: 4}],
    };
}

test("BO accounts for both bans, odd values, client limits and incomplete pools", () => {
    for (const [count, expected] of [[5, 3], [9, 7], [11, 9], [13, 11], [15, 13], [25, 23]]) {
        assert.deepEqual(calculateBracketBestOf(count), {bestOf: expected});
    }
    for (const [count, expected] of [[0, 9], [4, 9], [12, 9], [27, 23]]) {
        const result = calculateBracketBestOf(count);
        assert.equal(result.bestOf, expected);
        assert.ok(result.warning);
    }
});

test("exports compatible team, round, beatmap and match references without mutating saved data", () => {
    const input = fixture();
    const before = structuredClone(input);
    const {bracket, warnings} = generateBracket(input);
    assert.deepEqual(warnings, []);
    assert.deepEqual(bracket.Ruleset, {ShortName: "mania", OnlineID: 3});
    assert.equal(bracket.Teams.length, 2);
    assert.deepEqual(bracket.Teams[0].Players, [{id: 1, Username: "Player 1", country_code: "CN", Rank: 10}]);
    assert.equal(bracket.Matches[0].Team1Acronym, bracket.Teams[0].Acronym);
    assert.equal(bracket.Matches[0].Team2Acronym, bracket.Teams[1].Acronym);
    assert.equal(bracket.Matches[0].Date, "2026-09-10T12:00:00.000Z");
    assert.equal(bracket.Matches[0].Completed, true);
    assert.equal(bracket.Rounds[0].BestOf, 11);
    assert.equal(bracket.Rounds[0].BanCount, 1);
    assert.deepEqual(bracket.Rounds[0].Matches, [bracket.Matches[0].ID]);
    assert.deepEqual(bracket.Rounds[0].Beatmaps[0], {ID: 112, Mods: "NM"});
    assert.deepEqual(bracket.Progressions, []);
    assert.deepEqual(JSON.parse(JSON.stringify(bracket)), bracket);
    assert.deepEqual(input, before);
});

test("solo events resolve names to one-player teams and preserve legacy UTC schedule times", () => {
    const input = fixture();
    input.meta.is_group = false;
    input.meta.mode = "osu";
    input.maps.forEach((map) => {map.mode = "osu";});
    Object.assign(input.schedules[0], {team1: "Player 1", team2: "Player 2", match_time: "2026-09-10T12:00:00", is_winner_bracket: false, team1_score: 0, team2_score: 0});
    const {bracket} = generateBracket(input);
    assert.equal(bracket.Teams.length, 2);
    assert.equal(bracket.Teams[0].Acronym, "P1");
    assert.equal(bracket.Ruleset.OnlineID, 0);
    assert.equal(bracket.Matches[0].Losers, true);
    assert.equal(bracket.Matches[0].Completed, false);
    assert.equal(bracket.Matches[0].Date, "2026-09-10T12:00:00.000Z");
});

test("lobbies are explicitly skipped while later head-to-head matches retain valid round IDs", () => {
    const input = fixture();
    input.rounds.unshift({stage_name: "Qualifier", is_lobby: true});
    input.schedules.unshift({...input.schedules[0], stage_name: "Qualifier", match_id: "lobby", is_lobby: true, team1: "", team2: ""});
    const {bracket, warnings} = generateBracket(input);
    assert.equal(bracket.Matches.length, 1);
    assert.deepEqual(bracket.Rounds[0].Matches, []);
    assert.deepEqual(bracket.Rounds[1].Matches, [1]);
    assert.equal(bracket.Matches[0].Position.X, 400);
    assert.ok(warnings.some((warning) => warning.includes("1 场多人 Lobby")));
});

test("rejects broken references, ambiguous slots, duplicate matches and invalid data", () => {
    const cases: [RegExp, (input: BracketExportInput) => void][] = [
        [/对阵/, (input) => {input.schedules[0].team1 = "Unknown";}],
        [/用户信息/, (input) => {input.participants.players = [];}],
        [/重复/, (input) => {input.maps[1].number = input.maps[0].number;}],
        [/比赛 ID/, (input) => {input.schedules.push({...input.schedules[0]});}],
        [/对应轮次/, (input) => {input.maps[0].stage_name = "missing";}],
        [/有效日期/, (input) => {input.schedules[0].match_time = "bad";}],
        [/正整数 ID/, (input) => {input.maps[0].map_id = 2147483648;}],
        [/具体模式/, (input) => {input.meta.mode = "all";}],
    ];
    for (const [error, change] of cases) {
        const input = fixture();
        change(input);
        assert.throws(() => generateBracket(input), error);
    }
});

test("scores incompatible with calculated BO are preserved with a warning", () => {
    const input = fixture();
    input.schedules[0].team1_score = 7;
    const {bracket, warnings} = generateBracket(input);
    assert.equal(bracket.Matches[0].Team1Score, 7);
    assert.equal(bracket.Matches[0].Completed, false);
    assert.ok(warnings.some((warning) => warning.includes("已有比分")));
});

test("manual BO and ban counts apply to every round and determine match completion", () => {
    const input = fixture();
    input.rounds.push({stage_name: "Extra", start_time: "2026-09-11", is_lobby: false});
    const {bracket, warnings} = generateBracket(input, {bestOf: 9, banCount: 2});
    assert.deepEqual(bracket.Rounds.map((round) => [round.BestOf, round.BanCount]), [[9, 2], [9, 2]]);
    assert.equal(bracket.Matches[0].Completed, false);
    assert.ok(warnings.some((warning) => warning.includes("Extra") && warning.includes("至少需要 13 张图")));
});

test("automatic BO uses the chosen ban count including zero", () => {
    const input = fixture();
    assert.equal(generateBracket(input, {banCount: 2}).bracket.Rounds[0].BestOf, 9);
    const round = generateBracket(input, {banCount: 0}).bracket.Rounds[0];
    assert.equal(round.BestOf, 13);
    assert.equal(round.BanCount, 0);
});

test("invalid BO and ban counts cannot be exported", () => {
    for (const bestOf of [0, 1, 4, 25, 9.5, NaN, Infinity]) {
        assert.throws(() => generateBracket(fixture(), {bestOf}), /BO 请输入/);
    }
    for (const banCount of [-1, 6, 1.5, NaN, Infinity]) {
        assert.throws(() => generateBracket(fixture(), {banCount}), /Ban 数请输入/);
    }
    for (const bestOf of [3, 23]) assert.equal(generateBracket(fixture(), {bestOf}).bracket.Rounds[0].BestOf, bestOf);
});

test("each round independently controls automatic BO, explicit BO, bans and match completion", () => {
    const input = fixture();
    input.rounds.push({stage_name: "Grand Final", start_time: "2026-09-11", is_lobby: false});
    input.maps.push(...input.maps.map((map) => ({...map, stage_name: "Grand Final"})));
    input.schedules.push({...input.schedules[0], match_id: "uuid-2", stage_name: "Grand Final"});
    const {bracket} = generateBracket(input, {rounds: {
        Final: {banCount: 2},
        "Grand Final": {bestOf: 11, banCount: 1},
    }});
    assert.deepEqual(bracket.Rounds.map((round) => [round.BestOf, round.BanCount]), [[9, 2], [11, 1]]);
    assert.deepEqual(bracket.Matches.map((match) => match.Completed), [false, true]);
    assert.throws(() => generateBracket(input, {rounds: {Final: {banCount: 6}}}), /Final.*Ban/);
    assert.throws(() => generateBracket(input, {rounds: {"Grand Final": {bestOf: 10}}}), /Grand Final.*BO/);
});

test("edited acronyms update match references while preserving full names", () => {
    const {bracket} = generateBracket(fixture(), {acronyms: {"team:队伍 A": "ABC", "team:队伍 B": "🐇"}});
    assert.equal(bracket.Teams[0].FullName, "队伍 A");
    assert.equal(bracket.Teams[0].Acronym, "ABC");
    assert.equal(bracket.Matches[0].Team1Acronym, "ABC");
    assert.equal(bracket.Matches[0].Team2Acronym, "🐇");
});

test("empty, long and duplicate acronyms cannot be exported", () => {
    for (const value of ["", "    ", "ABCD", "一二三四", "A\tB"]) {
        assert.throws(() => generateBracket(fixture(), {acronyms: {"team:队伍 A": value}}), /简称/);
    }
    assert.throws(() => generateBracket(fixture(), {acronyms: {"team:队伍 A": "ABC", "team:队伍 B": " abc "}}), /重复/);
});

test("suggested acronyms stay short and unique even with many identical prefixes", () => {
    const entrant = getBracketEntrants(fixture())[0];
    const entrants = Array.from({length: 50}, (_, i) => ({...entrant, key: `team:${i}`, name: `AAA${i}`}));
    entrants.push({...entrant, key: "emoji", name: "🐇队伍名称"});
    const values = Object.values(getDefaultBracketAcronyms(entrants));
    assert.equal(new Set(values).size, entrants.length);
    assert.ok(values.every((value) => Array.from(value).length >= 1 && Array.from(value).length <= 3));
    assert.deepEqual(getDefaultBracketAcronyms(entrants), getDefaultBracketAcronyms(entrants));
});
