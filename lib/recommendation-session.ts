import type { Mode } from "./recommendation.ts";

export type RecommendationSession =
    | { status: "authenticated"; uid: number; defaultMode: Mode }
    | { status: "unauthorized" | "unavailable" };

export async function verifyRecommendationSession(uuid: string | undefined, backendUrl: string, fetcher: typeof fetch = fetch): Promise<RecommendationSession> {
    if (!uuid || !/^[\x21-\x7e]+$/.test(uuid) || /[;,]/.test(uuid)) return { status: "unauthorized" };
    try {
        const response = await fetcher(`${backendUrl.replace(/\/$/, "")}/api/me`, {
            headers: { Cookie: `uuid=${uuid}` }, cache: "no-store", redirect: "error",
            signal: AbortSignal.timeout(8000),
        });
        if (response.status === 401 || response.status === 403) return { status: "unauthorized" };
        if (!response.ok) return { status: "unavailable" };
        const user = await response.json();
        if (!user || !Number.isSafeInteger(user.uid) || user.uid <= 0) return { status: "unauthorized" };
        const defaultMode: Mode = ["osu", "taiko", "fruits", "mania"].includes(user.playmode) ? user.playmode : "osu";
        return { status: "authenticated", uid: user.uid, defaultMode };
    } catch {
        return { status: "unavailable" };
    }
}
