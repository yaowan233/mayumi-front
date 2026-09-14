import {siteConfig} from "@/config/site";
import type {BracketExportInput, BracketRoundOptions} from "./bracket_export";

export interface SharedBracketSettings {
    rounds: Record<string, {bestOf: number | null; banCount: number}>;
    acronyms: Record<string, string>;
}

export interface BracketSettingsResponse {
    settings: SharedBracketSettings;
    revision: number;
    updated_by: number | null;
}

async function readResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = `比赛端配置请求失败 (${response.status})`;
        try {
            const error = await response.json();
            if (typeof error.detail === "string") message = error.detail;
            else if (response.status === 422) message = "配置格式无效，请检查各轮 BO、Ban 和参赛简称";
        } catch { /* Keep the HTTP status if the response is not JSON. */ }
        throw new Error(message);
    }
    return response.json();
}

function bracketUrl(tournamentName: string) {
    return `${siteConfig.backend_url}/api/tournament-bracket/${encodeURIComponent(tournamentName)}`;
}

export async function getBracketConfiguration(tournamentName: string) {
    return readResponse<BracketSettingsResponse & {data: BracketExportInput}>(await fetch(bracketUrl(tournamentName), {
        credentials: "include", cache: "no-store",
    }));
}

export async function saveBracketConfiguration(tournamentName: string, revision: number, rounds: Record<string, BracketRoundOptions>, acronyms: Record<string, string>) {
    const settings: SharedBracketSettings = {
        rounds: Object.fromEntries(Object.entries(rounds).map(([name, round]) => [name, {bestOf: round.bestOf ?? null, banCount: round.banCount ?? 1}])),
        acronyms,
    };
    return readResponse<BracketSettingsResponse>(await fetch(`${bracketUrl(tournamentName)}/settings`, {
        method: "PUT", credentials: "include", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({revision, settings}),
    }));
}
