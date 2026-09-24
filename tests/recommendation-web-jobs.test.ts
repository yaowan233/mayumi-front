import assert from "node:assert/strict";
import test from "node:test";
import { createRecommendationJobs } from "../lib/recommendation-web-jobs.ts";
import { fetchWebRecommendations, readRecommendationJson } from "../lib/recommendation-client.ts";

test("empty gateway response gives a readable error rather than a JSON parser exception", async () => {
    await assert.rejects(readRecommendationJson(new Response(null, { status: 504 })), /连接中断.*504/);
});

test("web request submits once and polls short requests until ready", async () => {
    const methods: string[] = [];
    const responses = [Response.json({ jobId: "test", pending: true }, { status: 202 }),
        Response.json({ jobId: "test", pending: true }, { status: 202 }), Response.json({ items: [] })];
    const fetcher: typeof fetch = async (_, options) => { methods.push(options?.method ?? "GET"); return responses.shift()!; };
    const result = await fetchWebRecommendations(new URLSearchParams(), new AbortController().signal, fetcher, async () => {});
    assert.deepEqual(result.items, []);
    assert.deepEqual(methods, ["POST", "GET", "GET"]);
});

test("jobs return immediately, deduplicate, restrict ownership and expire", async () => {
    let now = 1000;
    const jobs = createRecommendationJobs(() => now);
    let finish!: (response: Response) => void;
    let runs = 0;
    const compute = () => { runs++; return new Promise<Response>(resolve => { finish = resolve; }); };
    const started = jobs.start(42, "query", compute);
    assert.equal(started.status, 202);
    const { jobId } = await started.json();
    assert.equal((await jobs.start(42, "query", compute).json()).jobId, jobId);
    assert.equal(runs, 1);
    assert.equal(jobs.poll(43, jobId).status, 404);
    assert.equal(jobs.poll(42, jobId).status, 202);
    finish(Response.json({ items: [] }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(await jobs.poll(42, jobId).json(), { items: [] });
    assert.deepEqual(await jobs.poll(42, jobId).json(), { items: [] });
    now += 120001;
    assert.equal(jobs.poll(42, jobId).status, 404);
});

test("jobs bound concurrency and preserve failure status", async () => {
    const jobs = createRecommendationJobs();
    jobs.start(1, "first", () => new Promise(() => {}));
    const second = jobs.start(2, "second", async () => Response.json({ error: "unavailable" }, { status: 503 }));
    assert.equal(jobs.start(3, "third", () => new Promise(() => {})).status, 429);
    const { jobId } = await second.json();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(jobs.poll(2, jobId).status, 503);
});
