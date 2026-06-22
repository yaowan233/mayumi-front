"use client";

import {Button} from "@heroui/react";
import {HomePage, TournamentInfo} from "@/components/homepage";
import {siteConfig} from "@/config/site";
import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";

export default function TournamentWrapperPage() {
    const params = useParams();
    const router = useRouter();
    const tournamentAbbr = decodeURIComponent(params.tournament as string);

    const [data, setData] = useState<TournamentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!tournamentAbbr) return;

            try {
                const res = await fetch(
                    `${siteConfig.backend_url}/api/tournament-info?tournament_name=${encodeURIComponent(tournamentAbbr)}`,
                    {credentials: "include"},
                );

                if (res.status === 200) {
                    const json = await res.json();
                    setData(json);
                } else if (res.status === 403) {
                    setError("您无权查看此比赛（审核中），请确认已登录且拥有管理员或主办方权限。");
                } else if (res.status === 404) {
                    setError("比赛不存在");
                } else {
                    setError("加载失败");
                }
            } catch (e) {
                console.error(e);
                setError("网络请求错误");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tournamentAbbr]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 pb-10">
                <div className="h-[280px] md:h-[420px] animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-white/[0.06]" />
                <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-8 dark:border-white/[0.06] dark:bg-zinc-900/70">
                    <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-6 h-10 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10">
                    <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{error || "未找到数据"}</h1>
                <Button onPress={() => router.back()} variant="secondary">
                    返回上一页
                </Button>
            </div>
        );
    }

    return <HomePage tournament_info={data} />;
}
