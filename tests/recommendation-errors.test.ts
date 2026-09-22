import assert from "node:assert/strict";
import test from "node:test";
import { recommendationServiceError } from "../lib/recommendation-errors.ts";

test("timeouts, data outages and overload keep distinct statuses and explanations", () => {
    assert.equal(recommendationServiceError(504)?.status, 504);
    assert.match(recommendationServiceError(504)!.error, /超时/);
    assert.match(recommendationServiceError(503)!.error, /数据查询失败/);
    assert.equal(recommendationServiceError(429)?.status, 429);
    assert.equal(recommendationServiceError(200), null);
    assert.equal(recommendationServiceError(422), null);
});
