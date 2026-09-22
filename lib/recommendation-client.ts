import type { RecommendationResponse } from "./recommendation.ts";

export async function readRecommendationJson(response: Response) {
    try { return await response.json(); }
    catch { throw new Error(`推荐连接中断或网关返回空内容（HTTP ${response.status}），请稍后重试。`); }
}

export async function fetchWebRecommendations(params: URLSearchParams, callerSignal: AbortSignal,
    fetcher: typeof fetch = fetch,
    pause = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(signal.reason); };
        const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 2000);
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
    })): Promise<RecommendationResponse> {
    const signal = AbortSignal.any([callerSignal, AbortSignal.timeout(660000)]);
    let response = await fetcher(`/api/recommendations?${params}`, { method: "POST", signal, cache: "no-store" });
    while (true) {
        const data = await readRecommendationJson(response);
        if (!response.ok) throw new Error(data.error || "推荐失败，请稍后重试。");
        if (response.status !== 202) {
            if (!Array.isArray(data.items)) throw new Error("推荐结果格式异常，请稍后重试。");
            return data;
        }
        if (typeof data.jobId !== "string" || !data.jobId) throw new Error("推荐任务响应异常，请重试。");
        await pause(signal);
        response = await fetcher(`/api/recommendations?job=${encodeURIComponent(data.jobId)}`, { signal, cache: "no-store" });
    }
}
