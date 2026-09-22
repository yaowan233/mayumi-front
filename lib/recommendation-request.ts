import { setTimeout as delay } from "node:timers/promises";
import { toCustomRequest, type Filters } from "./recommendation.ts";

export async function requestRecommendations(base: string, headers: Record<string, string>, filters: Filters,
    callerSignal: AbortSignal, fetcher: typeof fetch = fetch,
    pause = (signal: AbortSignal) => delay(2000, undefined, { signal })) {
    const personal = filters.source === "personal";
    const signal = AbortSignal.any([callerSignal, AbortSignal.timeout(personal ? 630000 : 150000)]);
    const url = new URL(personal ? "/recommend/personal/jobs" : "/recommend/custom", base);
    let response = await fetcher(url, { method: "POST", headers, body: JSON.stringify(toCustomRequest(filters)), cache: "no-store", signal });
    if (!personal || response.status !== 202) return response;
    while (true) {
        const job = await response.json();
        if (job.status === "ready" && job.result) return Response.json(job.result);
        if (job.status === "failed") return Response.json({ detail: "推荐后台准备失败，请稍后重试。" }, { status: 503 });
        if (!["queued", "running"].includes(job.status) || typeof job.job_id !== "string" || !job.job_id) {
            throw new Error("Invalid recommendation job state");
        }
        await pause(signal);
        response = await fetcher(new URL(`${url.pathname}/${encodeURIComponent(job.job_id)}`, base), { headers, cache: "no-store", signal });
        if (!response.ok) return response;
    }
}
