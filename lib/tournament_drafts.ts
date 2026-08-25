import {siteConfig} from "@/config/site";
import {TournamentStatus} from "@/lib/tournament_management";

export type DraftSection = "meta" | "rounds" | "mappool" | "schedule";

export interface ChangedDraftStage {
    stage_name: string;
    sections: Exclude<DraftSection, "meta">[];
}

export interface PublishDraftOptions {
    sections?: DraftSection[];
    stage_name?: string;
}

export interface DraftStatus {
    tournament_name: string;
    abbreviation: string;
    tournament_status: TournamentStatus;
    reject_reason?: string | null;
    changed_sections: DraftSection[];
    changed_stages: ChangedDraftStage[];
    has_changes: boolean;
    updated_at?: string | null;
    updated_by?: number | null;
}

export interface DraftSectionResponse<T> {
    section: DraftSection;
    is_saved: boolean;
    data: T;
}

export interface PublishDraftResponse {
    message: string;
    new_name: string;
    new_abbr: string;
    changed_sections: DraftSection[];
    tournament_status: TournamentStatus;
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (response.ok) return await response.json() as T;

    let message = `请求失败 (Code: ${response.status})`;
    try {
        const payload = await response.json();
        if (payload.detail) {
            message = typeof payload.detail === "string"
                ? payload.detail
                : JSON.stringify(payload.detail);
        }
    } catch {
        // Keep the status-based fallback when the response is not JSON.
    }
    throw new Error(message);
}

function draftUrl(tournamentName: string, suffix: string): string {
    return `${siteConfig.backend_url}/api/tournament-drafts/${encodeURIComponent(tournamentName)}/${suffix}`;
}

export async function getDraftStatus(tournamentName: string): Promise<DraftStatus> {
    const response = await fetch(draftUrl(tournamentName, "status"), {
        credentials: "include",
        cache: "no-store",
    });
    return parseResponse<DraftStatus>(response);
}

export async function getDraftSection<T>(
    tournamentName: string,
    section: DraftSection,
): Promise<DraftSectionResponse<T>> {
    const response = await fetch(draftUrl(tournamentName, section), {
        credentials: "include",
        cache: "no-store",
    });
    return parseResponse<DraftSectionResponse<T>>(response);
}

export async function saveDraftSection<T>(
    tournamentName: string,
    section: DraftSection,
    data: T,
): Promise<DraftSectionResponse<T>> {
    const response = await fetch(draftUrl(tournamentName, section), {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
        credentials: "include",
    });
    return parseResponse<DraftSectionResponse<T>>(response);
}

export async function publishTournamentDraft(
    tournamentName: string,
    options?: PublishDraftOptions,
): Promise<PublishDraftResponse> {
    const response = await fetch(draftUrl(tournamentName, "publish"), {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            sections: options?.sections ?? null,
            stage_name: options?.stage_name ?? null,
        }),
        credentials: "include",
    });
    return parseResponse<PublishDraftResponse>(response);
}

export async function getMappoolDraftPreview<T>(tournamentName: string): Promise<T> {
    const response = await fetch(draftUrl(tournamentName, "preview/mappool"), {
        credentials: "include",
        cache: "no-store",
    });
    return parseResponse<T>(response);
}
