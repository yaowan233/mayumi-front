import assert from "node:assert/strict";
import test from "node:test";
import { requestRecommendations } from "../lib/recommendation-request.ts";
import { personalDefaults, defaults } from "../lib/recommendation.ts";

test("personal request uses Bot jobs path, polls once submitted, and keeps result ordering", async () => {
    const calls: { url: string; options?: RequestInit }[] = [];
    const results = [{ status: "queued", job_id: "abc" }, { status: "running", job_id: "abc" },
        { status: "ready", result: { items: [{ beatmap_id: 3 }, { beatmap_id: 1 }] } }];
    const fetcher: typeof fetch = async (url, options) => {
        calls.push({ url: String(url), options });
        return Response.json(results.shift(), { status: calls.length === 1 ? 202 : 200 });
    };
    const result = await requestRecommendations("http://localhost:8000", { Authorization: "Bearer test" }, personalDefaults(42),
        new AbortController().signal, fetcher, async () => {});
    assert.equal(calls[0].url, "http://localhost:8000/recommend/personal/jobs");
    assert.equal(calls[1].url, "http://localhost:8000/recommend/personal/jobs/abc");
    assert.equal(calls.filter(call => call.options?.method === "POST").length, 1);
    assert.deepEqual(await result.json(), { items: [{ beatmap_id: 3 }, { beatmap_id: 1 }] });
    assert.equal(calls[1].options?.headers, calls[0].options?.headers);
});

test("condition discovery retains its endpoint and abort signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher: typeof fetch = async (url, options) => {
        assert.equal(String(url), "http://localhost:8000/recommend/custom");
        assert.ok(options?.signal?.aborted);
        throw controller.signal.reason;
    };
    await assert.rejects(requestRecommendations("http://localhost:8000", {}, defaults, controller.signal, fetcher));
});

test("failed jobs return an error instead of an empty recommendation", async () => {
    const fetcher: typeof fetch = async () => Response.json({ status: "failed", job_id: "abc" }, { status: 202 });
    const response = await requestRecommendations("http://localhost:8000", {}, personalDefaults(42), new AbortController().signal, fetcher);
    assert.equal(response.status, 503);
});
