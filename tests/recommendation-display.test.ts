import assert from "node:assert/strict";
import test from "node:test";
import { botRecommendationDisplay } from "../lib/recommendation-display.ts";
import { recommendationPpDisplay } from "../lib/recommendation-pp.ts";

test("all modes use the same target PP and ACC as Bot, without evidence re-filtering", () => {
    for (const mode of ["osu", "mania", "taiko", "fruits"]) {
        const raw = { pred_pp: 100, pred_acc: 95, key_count: 7,
            [mode === "fruits" ? "practice_target" : "accuracy_target"]:
                { accuracy: 99, pp: 250, weighted_gain: 0, misses: 0, combo: 1234 } };
        const display = botRecommendationDisplay(raw, mode);
        assert.equal(display.pp, 250);
        assert.equal(display.acc, 99);
        assert.equal(display.weightedGain, 0);
        assert.ok(display.isTarget);
        assert.equal(recommendationPpDisplay({ pp: 100, botDisplay: display }, mode).primary, 250);
    }
});

test("missing targets retain predictions and unknown gain, not fake practice targets", () => {
    const display = botRecommendationDisplay({ key_count: 7, pred_pp: 150, pred_acc: 97 }, "mania");
    assert.equal(display.pp, 150);
    assert.equal(display.acc, 97);
    assert.equal(display.weightedGain, undefined);
    assert.equal(display.explanation, "7K · 预测 ACC · 无练习目标");
    assert.equal(display.isTarget, false);
});

test("invalid goals do not replace valid predictions", () => {
    const display = botRecommendationDisplay({ pred_pp: 150, pred_acc: 97, accuracy_target: { pp: 300, accuracy: 105 } }, "taiko");
    assert.equal(display.pp, 150);
    assert.equal(display.isTarget, false);
});
