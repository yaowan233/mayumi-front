export interface DrawEntrant {id: string; name: string; avatar_url: string}
export type DrawSource = {kind: "seed"; seed: number} | {kind: "bye"} | {kind: "pending"; label: string} | {kind: "winner" | "loser"; match_id: string};
export interface DrawRound {id: string; name: string; stage_name?: string; bracket: "winner" | "loser" | "final"; best_of: number | null}

export function drawRoundGroups(rounds: DrawRound[]): DrawRound[][] {
    const groups = new Map<string, DrawRound[]>();
    for (const round of rounds) {
        const stage = round.stage_name ?? round.id;
        const group = groups.get(stage) ?? [];
        group.push(round);
        groups.set(stage, group);
    }
    return [...groups.values()];
}
export interface DrawMatch {
    id: string; round_id: string; sources: DrawSource[]; teams: (string | null)[]; scores: number[];
    status: "pending" | "ready" | "playing" | "completed" | "bye" | "unneeded";
    winner: string | null; loser: string | null; datetime: string | null;
}
export interface TournamentDraw {
    origin?: "schedule" | "schedule_plan"; warnings?: string[];
    format: "single" | "double"; reset_final: boolean; entrants: DrawEntrant[];
    rounds: DrawRound[]; matches: DrawMatch[]; champion: string | null;
}
export interface DrawResponse {
    revision: number; state: TournamentDraw | null; is_published: boolean; has_changes: boolean;
}
export interface DrawManagementResponse extends DrawResponse {
    entrants: DrawEntrant[]; can_publish: boolean;
    saved_schedule?: {round_count: number; match_count: number; entrant_ids?: string[]};
}

export class DrawRequestError extends Error {
    dependentMatches: string[];
    constructor(message: string, dependentMatches: string[] = []) {
        super(message);
        this.dependentMatches = dependentMatches;
    }
}

export async function requestDraw<T>(url: string, body?: unknown, method = "POST"): Promise<T> {
    const response = await fetch(url, body === undefined ? {credentials: "include", cache: "no-store"} : {
        method, credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new DrawRequestError(typeof data?.detail === "string" ? data.detail : data?.detail?.message || `请求失败（${response.status}），请重新加载后重试`, data?.detail?.dependent_matches ?? []);
    }
    return data as T;
}

export function drawSlotLabel(state: TournamentDraw, match: DrawMatch, index: number): string {
    const entrant = state.entrants.find(p => p.id === match.teams[index]);
    if (entrant) return entrant.name;
    if (match.status === "unneeded") return "无需加赛";
    if (match.status === "bye") return "轮空";
    const source = match.sources[index];
    if (source.kind === "bye") return "轮空";
    if (source.kind === "seed") return `种子 ${source.seed}`;
    if (source.kind === "pending") return source.label;
    const parent = state.matches.find(m => m.id === source.match_id);
    if (parent?.status === "bye" && parent[source.kind] === null) return "轮空";
    return `${source.match_id} ${source.kind === "winner" ? "胜者" : "败者"}`;
}

export const DRAW_STATUS: Record<DrawMatch["status"], string> = {
    pending: "等待晋级", ready: "待开始", playing: "进行中", completed: "已结束", bye: "轮空晋级", unneeded: "无需加赛",
};

export function formatMatchScore(score: number): string {
    return score === -1 ? "弃权" : String(score);
}

// Collapse automatic advances for display without changing the saved bracket.
export function visibleDraw(state: TournamentDraw): TournamentDraw {
    const byId = new Map(state.matches.map(match => [match.id, match]));
    const resolveSource = (source: DrawSource): DrawSource => {
        if (!("match_id" in source)) return source;
        const parent = byId.get(source.match_id);
        if (!parent || parent.status !== "bye") return source;
        if (source.kind === "loser") return {kind: "bye"};
        const winnerIndex = parent.winner === null ? -1 : parent.teams.indexOf(parent.winner);
        if (winnerIndex >= 0) return resolveSource(parent.sources[winnerIndex]);
        return parent.sources.map(resolveSource).find(item => item.kind !== "bye") ?? {kind: "bye"};
    };
    const matches = state.matches.filter(match => match.status !== "bye").map(match => ({
        ...match, sources: match.sources.map(resolveSource),
    }));
    return {...state, matches, rounds: state.rounds.filter(round => matches.some(match => match.round_id === round.id))};
}

export function layoutDraw(state: TournamentDraw) {
    const positions: Record<string, {x: number; y: number}> = {};
    const headers: {round: DrawRound; x: number; y: number}[] = [];
    let offset = 40;
    let width = 320;
    for (const bracket of ["winner", "loser", "final"] as const) {
        const rounds = state.rounds.filter(r => r.bracket === bracket);
        if (!rounds.length) continue;
        const count = Math.max(1, ...rounds.map(r => state.matches.filter(m => m.round_id === r.id).length));
        const height = count * 160;
        rounds.forEach((round, column) => {
            const x = 24 + column * 320;
            headers.push({round, x, y: offset});
            const matches = state.matches.filter(m => m.round_id === round.id);
            matches.forEach((match, row) => {positions[match.id] = {x, y: offset + 44 + (row + 0.5) * height / matches.length - 66};});
            width = Math.max(width, x + 296);
        });
        offset += height + 100;
    }
    return {positions, headers, width, height: offset};
}
