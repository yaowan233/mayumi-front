import { randomUUID } from "node:crypto";

type Job = { owner: number; key: string; completed: number; result?: Response };

export function createRecommendationJobs(now = Date.now) {
    const jobs = new Map<string, Job>();
    const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    function prune() {
        for (const [id, job] of jobs) if (job.completed && now() - job.completed > 120000) jobs.delete(id);
    }
    return {
        start(owner: number, key: string, compute: () => Promise<Response>) {
            prune();
            for (const [id, job] of jobs) {
                if (job.owner === owner && job.key === key) return reply({ jobId: id, pending: true }, 202);
            }
            if ([...jobs.values()].filter(job => !job.completed).length >= 2 || jobs.size >= 16) {
                return reply({ error: "推荐服务忙，请稍后重试。" }, 429);
            }
            const id = randomUUID();
            const job: Job = { owner, key, completed: 0 };
            jobs.set(id, job);
            void Promise.resolve().then(compute).then(result => { job.result = result; }, () => {
                job.result = reply({ error: "推荐准备失败，请稍后重试。" }, 503);
            }).finally(() => { job.completed = now(); });
            return reply({ jobId: id, pending: true }, 202);
        },
        poll(owner: number, id: string) {
            prune();
            const job = jobs.get(id);
            if (!job || job.owner !== owner) return reply({ error: "推荐任务已过期或服务已重启，请重新推荐。" }, 404);
            return job.result?.clone() ?? reply({ jobId: id, pending: true }, 202);
        },
    };
}
