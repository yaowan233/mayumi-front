import assert from "node:assert/strict";
import test from "node:test";
import {isScheduleVisible} from "../lib/schedule_possibilities.ts";

test("far future and automatic advances stay hidden while manual and next matches remain visible", () => {
    assert.equal(isScheduleVisible({is_future_pending: true}), false);
    assert.equal(isScheduleVisible({is_automatic_advance: true}), false);
    assert.equal(isScheduleVisible({is_future_pending: false}), true);
    assert.equal(isScheduleVisible({}), true);
});
