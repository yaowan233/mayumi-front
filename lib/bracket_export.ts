import type {TournamentPlayers, Player} from "../app/tournaments/[tournament]/participants/page";
import type {TournamentMap} from "./mappool_import";
import {toUtcISOString} from "./datetime.ts";

export interface BracketRoundInput {
    stage_name: string;
    start_time?: string;
    is_lobby: boolean;
    is_solo_qualifier?: boolean;
}

export interface BracketScheduleInput {
    match_id: string;
    stage_name: string;
    is_lobby: boolean;
    is_winner_bracket: boolean;
    match_time: string;
    team1: string;
    team2: string;
    team1_score?: number;
    team2_score?: number;
}

export interface BracketExportInput {
    meta: {mode: string; is_group: boolean; start_date: string};
    participants: TournamentPlayers;
    rounds: BracketRoundInput[];
    maps: TournamentMap[];
    schedules: BracketScheduleInput[];
}

const RULESETS: Record<string, {ShortName: string; OnlineID: number}> = {
    osu: {ShortName: "osu", OnlineID: 0},
    taiko: {ShortName: "taiko", OnlineID: 1},
    fruits: {ShortName: "fruits", OnlineID: 2},
    mania: {ShortName: "mania", OnlineID: 3},
};

export interface BracketRoundOptions {
    bestOf?: number;
    banCount?: number;
}

export interface BracketExportOptions extends BracketRoundOptions {
    rounds?: Record<string, BracketRoundOptions>;
    acronyms?: Record<string, string>;
}

export const BRACKET_ACRONYM_MAX_LENGTH = 3;

export interface BracketEntrant {
    key: string;
    name: string;
    kind: "team" | "player";
    players: Player[];
}

export function getBracketEntrants({meta, participants, rounds}: BracketExportInput): BracketEntrant[] {
    const entrants: BracketEntrant[] = [];
    const playersById = new Map(participants.players.map((player) => [player.uid, player]));
    if (meta.is_group) {
        for (const team of (participants.groups ?? []).filter((team) => team.is_verified)) {
            const players = [...new Set([...team.captains, ...team.members])].map((uid) => {
                const player = playersById.get(uid);
                if (!player) throw new Error(`队伍“${team.name}”的成员 ${uid} 缺少用户信息`);
                return player;
            });
            entrants.push({key: `team:${team.name}`, name: team.name, kind: "team", players});
        }
    }
    if (!meta.is_group || rounds.some((round) => round.is_solo_qualifier && !round.is_lobby)) {
        for (const player of participants.players.filter((player) => player.player)) {
            entrants.push({key: `player:${player.uid}`, name: player.name, kind: "player", players: [player]});
        }
    }
    return entrants;
}

export function getDefaultBracketAcronyms(entrants: BracketEntrant[]): Record<string, string> {
    const used = new Set<string>();
    return Object.fromEntries(entrants.map((entrant) => {
        const words = entrant.name.trim().split(/\s+/);
        const base = Array.from((words.length > 1 ? words.map((word) => Array.from(word)[0]).join("") : entrant.name.trim()).toUpperCase()).slice(0, BRACKET_ACRONYM_MAX_LENGTH).join("") || "T";
        let acronym = base;
        let index = 1;
        while (used.has(acronym)) {
            const suffix = (index++).toString(36).toUpperCase();
            if (suffix.length > BRACKET_ACRONYM_MAX_LENGTH) throw new Error("参赛单位过多，无法生成唯一短简称");
            acronym = Array.from(base).slice(0, BRACKET_ACRONYM_MAX_LENGTH - suffix.length).join("") + suffix;
        }
        used.add(acronym);
        return [entrant.key, acronym];
    }));
}

export function getBracketAcronymErrors(entrants: BracketEntrant[], acronyms: Record<string, string>): Record<string, string> {
    const errors: Record<string, string> = {};
    const used = new Map<string, string>();
    for (const entrant of entrants) {
        const value = acronyms[entrant.key]?.trim() ?? "";
        if (!value || /[\r\n\t]/.test(value) || Array.from(value).length > BRACKET_ACRONYM_MAX_LENGTH) {
            errors[entrant.key] = `简称需为 1–${BRACKET_ACRONYM_MAX_LENGTH} 个字符，不能含换行或制表符`;
        }
        const previous = used.get(value.toUpperCase());
        if (previous) {
            errors[previous] = errors[entrant.key] = `简称“${value}”重复`;
        }
        used.set(value.toUpperCase(), entrant.key);
    }
    return errors;
}

export function getBracketOptionsError({bestOf, banCount = 1}: BracketRoundOptions): string | null {
    if (bestOf !== undefined && (!Number.isInteger(bestOf) || bestOf < 3 || bestOf > 23 || bestOf % 2 === 0)) {
        return "BO 请输入 3–23 之间的奇数，或留空自动计算";
    }
    if (!Number.isInteger(banCount) || banCount < 0 || banCount > 5) return "每方 Ban 数请输入 0–5 之间的整数";
    return null;
}

// The client accepts odd BestOf values from 3 to 23.
export function calculateBracketBestOf(mapCount: number, banCount = 1): {bestOf: number; warning?: string} {
    const available = mapCount - 2 * banCount;
    if (available < 3) {
        return {bestOf: 9, warning: `图池仅有 ${mapCount} 张，无法按双方各 ${banCount} Ban 计算 BO，暂用 BO9`};
    }
    const bestOf = Math.min(23, available % 2 === 0 ? available - 1 : available);
    return {
        bestOf,
        ...(bestOf !== available ? {warning: `${mapCount} 张图扣除双方各 ${banCount} Ban 后剩 ${available} 张，按客户端支持的奇数局制使用 BO${bestOf}`} : {}),
    };
}

function positiveId(value: number | undefined, label: string): number {
    if (!Number.isInteger(value) || value! <= 0 || value! > 2147483647) throw new Error(`${label}必须为有效的正整数 ID`);
    return value!;
}

function exportPlayer(player: Player) {
    return {
        id: positiveId(player.uid, `${player.name} 的 osu! `),
        Username: player.name,
        country_code: /^[A-Z]{2}$/.test(player.country ?? "") ? player.country : "Unknown",
        ...(Number.isInteger(player.rank) && player.rank > 0 ? {Rank: player.rank} : {}),
    };
}

function requiredDate(value: string | undefined, label: string): string {
    const date = toUtcISOString(value);
    if (!date) throw new Error(`${label}缺少有效日期，请先保存完整信息`);
    return date;
}

export function generateBracket(input: BracketExportInput, options: BracketExportOptions = {}) {
    const optionsError = getBracketOptionsError(options);
    if (optionsError) throw new Error(optionsError);
    const {meta, participants, rounds, maps, schedules} = input;
    const ruleset = RULESETS[meta.mode];
    if (!ruleset) throw new Error("比赛端每份配置仅支持一个游戏模式，请先为赛事设置具体模式");
    if (rounds.length === 0) throw new Error("暂无已保存轮次，请先添加轮次");
    const warnings: string[] = [];
    const teams: {
        FullName: string; Acronym: string; FlagName: string; Players: ReturnType<typeof exportPlayer>[];
        SeedingResults: never[]; Seed: string; LastYearPlacing: string;
    }[] = [];
    const teamKeys = new Map<string, string>();
    const soloKeys = new Map<string, string>();

    const addTeam = (name: string, acronym: string, players: Player[], lookup: Map<string, string>, flag = "") => {
        if (!name.trim() || lookup.has(name)) throw new Error(`参赛名称为空或重复：${name}`);
        lookup.set(name, acronym);
        teams.push({FullName: name, Acronym: acronym, FlagName: flag, Players: players.map(exportPlayer), SeedingResults: [], Seed: "", LastYearPlacing: "N/A"});
    };

    const entrants = getBracketEntrants(input);
    const acronyms = {...getDefaultBracketAcronyms(entrants), ...options.acronyms};
    const acronymErrors = getBracketAcronymErrors(entrants, acronyms);
    const invalidEntrant = entrants.find((entrant) => acronymErrors[entrant.key]);
    if (invalidEntrant) throw new Error(`${invalidEntrant.name}：${acronymErrors[invalidEntrant.key]}`);
    for (const entrant of entrants) {
        const country = entrant.players[0]?.country ?? "";
        addTeam(entrant.name, acronyms[entrant.key].trim(), entrant.players, entrant.kind === "team" ? teamKeys : soloKeys,
            entrant.kind === "player" && /^[A-Z]{2}$/.test(country) ? country : "");
    }
    if (teams.length === 0) throw new Error("暂无可导出的参赛选手或已审核队伍");

    const roundNames = new Set<string>();
    for (const round of rounds) {
        if (!round.stage_name.trim() || roundNames.has(round.stage_name)) throw new Error(`轮次名称为空或重复：${round.stage_name}`);
        roundNames.add(round.stage_name);
    }
    for (const item of [...maps, ...schedules]) {
        if (!roundNames.has(item.stage_name)) throw new Error(`“${item.stage_name}”缺少对应轮次，请先保存轮次信息`);
    }

    const exportedRounds = rounds.map((round) => {
        const settings = options.rounds?.[round.stage_name] ?? options;
        const settingsError = getBracketOptionsError(settings);
        if (settingsError) throw new Error(`${round.stage_name}：${settingsError}`);
        const banCount = settings.banCount ?? 1;
        const roundMaps = maps.filter((map) => map.stage_name === round.stage_name);
        const slots = new Set<string>();
        const modOrder = new Map<string, number>();
        const beatmaps = roundMaps.map((map) => {
            const mod = map.mod?.trim().toUpperCase();
            if (!mod || !Number.isInteger(map.number) || map.number! <= 0) throw new Error(`“${round.stage_name}”存在未填写 Mod 或序号的谱面`);
            if (map.mode && map.mode !== meta.mode) throw new Error(`“${round.stage_name}”存在与赛事模式不一致的谱面`);
            const slot = `${mod}:${map.number}`;
            if (slots.has(slot)) throw new Error(`“${round.stage_name}”的 ${mod}${map.number} 重复`);
            slots.add(slot);
            if (!modOrder.has(mod)) modOrder.set(mod, modOrder.size);
            return {ID: positiveId(map.map_id, `“${round.stage_name}”的谱面 `), Mods: mod, number: map.number!};
        }).sort((a, b) => modOrder.get(a.Mods)! - modOrder.get(b.Mods)! || a.number - b.number);
        const {bestOf, warning} = settings.bestOf === undefined
            ? calculateBracketBestOf(beatmaps.length, banCount)
            : {bestOf: settings.bestOf};
        if (warning) warnings.push(`${round.stage_name}：${warning}`);
        if (settings.bestOf !== undefined && beatmaps.length < settings.bestOf + 2 * banCount) {
            warnings.push(`${round.stage_name}：BO${settings.bestOf}、每方 ${banCount} Ban 至少需要 ${settings.bestOf + 2 * banCount} 张图，当前仅有 ${beatmaps.length} 张`);
        }
        return {
            Name: round.stage_name,
            Description: "",
            BestOf: bestOf,
            BanCount: banCount,
            Beatmaps: beatmaps.map(({ID, Mods}) => ({ID, Mods})),
            StartDate: requiredDate(round.start_time || meta.start_date, `“${round.stage_name}”`),
            Matches: [] as number[],
        };
    });

    const matches: {
        ID: number; Team1Acronym: string; Team2Acronym: string; Team1Score: number; Team2Score: number;
        Completed: boolean; Losers: boolean; PicksBans: never[]; Current: boolean; Date: string;
        ConditionalMatches: never[]; Position: {X: number; Y: number};
    }[] = [];
    const matchIds = new Set<string>();
    let skippedLobbies = 0;
    for (const schedule of schedules) {
        const roundIndex = rounds.findIndex((round) => round.stage_name === schedule.stage_name);
        const round = rounds[roundIndex];
        if (schedule.is_lobby || round.is_lobby) {
            skippedLobbies++;
            continue;
        }
        if (!schedule.match_id || matchIds.has(schedule.match_id)) throw new Error("赛程存在空白或重复的比赛 ID");
        matchIds.add(schedule.match_id);
        const lookup = meta.is_group && !round.is_solo_qualifier ? teamKeys : soloKeys;
        const team1 = lookup.get(schedule.team1);
        const team2 = lookup.get(schedule.team2);
        if (!team1 || !team2 || team1 === team2) throw new Error(`“${schedule.stage_name}”的对阵“${schedule.team1} vs ${schedule.team2}”无效或参赛信息缺失`);
        const score1 = schedule.team1_score ?? 0;
        const score2 = schedule.team2_score ?? 0;
        if (![score1, score2].every((score) => Number.isInteger(score) && score >= 0)) throw new Error(`“${schedule.stage_name}”存在无效比分`);
        const exportedRound = exportedRounds[roundIndex];
        const pointsToWin = (exportedRound.BestOf + 1) / 2;
        const id = matches.length + 1;
        matches.push({
            ID: id, Team1Acronym: team1, Team2Acronym: team2, Team1Score: score1, Team2Score: score2,
            Completed: Math.max(score1, score2) === pointsToWin && Math.min(score1, score2) < pointsToWin,
            Losers: !schedule.is_winner_bracket, PicksBans: [], Current: false,
            Date: requiredDate(schedule.match_time, `“${schedule.stage_name}”的对阵`),
            ConditionalMatches: [], Position: {X: roundIndex * 400, Y: exportedRound.Matches.length * 150},
        });
        if (Math.max(score1, score2) > pointsToWin || (score1 === score2 && score1 >= pointsToWin)) {
            warnings.push(`${schedule.team1} vs ${schedule.team2}：已有比分与 BO${exportedRound.BestOf} 不符，已保留比分并标记为未结束`);
        }
        exportedRound.Matches.push(id);
    }
    if (skippedLobbies) warnings.push(`已跳过 ${skippedLobbies} 场多人 Lobby，比赛端对阵仅支持双方比赛；对应轮次和图池仍保留`);

    return {
        bracket: {
            Ruleset: {...ruleset}, Matches: matches, Rounds: exportedRounds, Teams: teams, Progressions: [],
            ChromaKeyWidth: 1366, PlayersPerTeam: 3, AutoProgressScreens: true, SplitMapPoolByMods: true, DisplayTeamSeeds: false,
        },
        warnings,
    };
}
