import assert from "node:assert/strict";
import test from "node:test";
import {readStatisticsResponse, StatisticsRequestError} from "../lib/statistics-response.ts";

test("reports the round endpoint's plain-text HTTP 500 without parsing it as JSON", async () => {
    await assert.rejects(
        readStatisticsResponse(new Response("Internal Server Error", {status: 500}), "轮次信息"),
        (error: unknown) => error instanceof StatisticsRequestError && error.message === "轮次信息加载失败（HTTP 500），请稍后重试",
    );
});

test("keeps preview authorization failures visible without leaking the response body", async () => {
    await assert.rejects(
        readStatisticsResponse(new Response('{"detail":"private details"}', {status: 403}), "统计预览"),
        (error: unknown) => error instanceof StatisticsRequestError && error.message === "统计预览加载失败（HTTP 403），请稍后重试",
    );
});

test("reports malformed successful responses without exposing their contents", async () => {
    await assert.rejects(
        readStatisticsResponse(new Response("<html>upstream details</html>"), "图池"),
        (error: unknown) => error instanceof StatisticsRequestError && error.message === "图池返回的数据格式异常，请稍后重试",
    );
});

test("preserves valid statistics data and legacy null responses", async () => {
    const rounds = [{stage_name: "RO16", start_time: "2026-10-17"}, {stage_name: "四分之一决赛", start_time: null}];
    assert.deepEqual(await readStatisticsResponse(new Response(JSON.stringify(rounds)), "轮次信息"), rounds);
    assert.equal(await readStatisticsResponse(new Response("null"), "统计数据"), null);
});
