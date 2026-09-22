import { cookies } from "next/headers";
import { siteConfig } from "@/config/site";
import { verifyRecommendationSession } from "@/lib/recommendation-session";
import { modes, selectedKeyCounts } from "@/lib/recommendation";
import { validProfileReference } from "@/lib/profile-reference";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
    const session = await verifyRecommendationSession((await cookies()).get("uuid")?.value, siteConfig.backend_url);
    if (session.status !== "authenticated") return reply({ error: session.status === "unauthorized" ? "请先登录后查看画像。" : "登录验证暂时不可用。" }, session.status === "unauthorized" ? 401 : 503);
    const params = new URL(request.url).searchParams;
    const mode = params.get("mode") ?? "osu";
    const uid = params.get("uid") ?? String(session.uid);
    let keys: number[];
    try {
        if ([...params.keys()].some(key => !["mode", "uid", "keyCounts"].includes(key)) || !modes.some(value => value === mode) || !/^[1-9]\d{0,9}$/.test(uid)) throw new Error();
        keys = selectedKeyCounts(params.get("keyCounts") ?? "");
        if (keys.length && mode !== "mania") throw new Error();
    } catch { return reply({ error: "画像模式、玩家或键数无效。" }, 400); }
    const base = process.env.CUSTOM_RECOMMENDER_API_URL;
    if (!base) return reply({ error: "尚未配置画像服务。" }, 503);
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.CUSTOM_RECOMMENDER_API_TOKEN) headers.Authorization = `Bearer ${process.env.CUSTOM_RECOMMENDER_API_TOKEN}`;
        const response = await fetch(new URL("/recommend/profile", base), { method: "POST", headers,
            body: JSON.stringify({ mode, player_id: Number(uid), key_counts: keys }), cache: "no-store",
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) });
        if (!response.ok) return reply({ error: "画像暂时无法读取，可继续使用推荐或稍后重试。" }, 503);
        const data: unknown = await response.json();
        if (!validProfileReference(data, mode, Number(uid))) throw new Error();
        if (keys.length && data.groups.some(group => group.key_count === null || !keys.includes(group.key_count))) throw new Error();
        return reply(data);
    } catch { return reply({ error: "画像读取失败或超时，不影响现有筛选。" }, 503); }
}
