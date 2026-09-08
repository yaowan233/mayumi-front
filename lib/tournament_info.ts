import "server-only";

import {cache} from "react";
import {cookies} from "next/headers";
import {siteConfig} from "@/config/site";
import type {TournamentInfo} from "@/components/homepage";

// Reuse the response within one render, without caching private data across users.
export const getTournamentInfo = cache(async (tournament: string): Promise<{
    data: TournamentInfo | null;
    error: string;
}> => {
    try {
        const cookieHeader = (await cookies()).toString();
        const response = await fetch(
            `${siteConfig.backend_url}/api/tournament-info?tournament_name=${encodeURIComponent(tournament)}`,
            {cache: "no-store", headers: cookieHeader ? {Cookie: cookieHeader} : undefined},
        );
        if (!response.ok) {
            return {data: null, error: response.status === 403
                ? "您无权查看此比赛（审核中），请确认已登录且拥有管理员或主办方权限。"
                : response.status === 404 ? "比赛不存在" : "加载失败"};
        }
        return {data: await response.json(), error: ""};
    } catch {
        return {data: null, error: "网络请求错误"};
    }
});
