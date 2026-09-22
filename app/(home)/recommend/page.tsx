import type { Metadata } from "next";
import { RecommendationExplorer } from "@/components/recommendation_explorer";
import { cookies } from "next/headers";
import { siteConfig } from "@/config/site";
import { verifyRecommendationSession } from "@/lib/recommendation-session";

export const metadata: Metadata = { title: "谱面推荐", description: "按你的条件发现谱面，或结合 BP 探索适合自己的挑战。" };

export const dynamic = "force-dynamic";

export default async function RecommendPage() {
    const session = await verifyRecommendationSession((await cookies()).get("uuid")?.value, siteConfig.backend_url);
    if (session.status !== "authenticated") {
        const unavailable = session.status === "unavailable";
        const params = new URLSearchParams({ client_id: siteConfig.client_id, redirect_uri: `${siteConfig.web_url}/oauth`, response_type: "code", scope: "public" });
        return <section className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white px-8 py-12 text-center dark:border-white/10 dark:bg-zinc-900">
            <p className="text-xs font-bold tracking-widest text-primary">MAYUMI / RECOMMEND</p>
            <h1 className="mt-4 text-2xl font-bold">{unavailable ? "暂时无法验证登录状态" : "登录后使用谱面推荐"}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{unavailable ? "登录服务暂时不可用，请稍后刷新重试。" : "按条件发现和按玩家推荐均需登录 osu! 账号后使用。"}</p>
            <a href={unavailable ? "/recommend" : `https://osu.ppy.sh/oauth/authorize?${params}`} className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{unavailable ? "重新检查" : "使用 osu! 账号登录"}</a>
        </section>;
    }
    return <RecommendationExplorer key={`${session.uid}:${session.defaultMode}`} currentUserId={session.uid} defaultMode={session.defaultMode} />;
}
