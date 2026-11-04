"use client";

import {useContext} from "react";
import {Spinner} from "@heroui/react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {RecommendationExplorer} from "@/components/recommendation_explorer";

export function RecommendationPage() {
    const session = useContext(CurrentUserContext);
    if (session?.isLoading) return <div role="status" aria-label="正在加载用户信息" className="flex justify-center py-16"><Spinner/></div>;
    const user = session?.currentUser;
    if (!user) {
        const unavailable = !!session?.error;
        const params = new URLSearchParams({client_id: siteConfig.client_id, redirect_uri: `${siteConfig.web_url}/oauth`, response_type: "code", scope: "public"});
        return <section className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white px-8 py-12 text-center dark:border-white/10 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold">谱面推荐</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{unavailable ? "暂时无法验证登录，请稍后重试。" : "登录 osu!，发现适合你的谱面。"}</p>
            <a href={unavailable ? "/recommend" : `https://osu.ppy.sh/oauth/authorize?${params}`} className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{unavailable ? "重试" : "登录 osu!"}</a>
        </section>;
    }
    const mode = ["osu", "taiko", "fruits", "mania"].includes(user.playmode ?? "") ? user.playmode! : "osu";
    return <RecommendationExplorer key={`${user.uid}:${mode}`} currentUserId={user.uid} defaultMode={mode}/>;
}
