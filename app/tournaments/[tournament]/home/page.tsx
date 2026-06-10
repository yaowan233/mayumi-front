"use client"

import {Button, Spinner} from "@heroui/react";
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
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="accent" />
                <span className="text-default-500">正在加载比赛信息...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <div className="text-4xl">⚠️</div>
                <h1 className="text-xl font-bold text-danger">{error || "未找到数据"}</h1>
                <Button onPress={() => router.back()} variant="secondary">
                    返回上一页
                </Button>
            </div>
        );
    }

    return <HomePage tournament_info={data} />;
}
