import assert from "node:assert/strict";
import test from "node:test";
import { recommendationPpDisplay } from "../lib/recommendation-pp.ts";

const item = {
    pp: 160,
    practiceTarget: { pp: 376.7, misses: 0, combo: 1915, accuracy: 99.56, weightedGain: 6.04 },
    fcEvidence: { tier: "fc-supported" as const, references: [{ mapId: 1, misses: 0 }] },
};

test("CTB prioritizes evidenced practice PP without modifying single-play prediction", () => {
    assert.deepEqual(recommendationPpDisplay(item, "fruits"), {
        label: "刷图目标 PP", primary: 376.7, secondary: 160, target: "FC 目标", weightedGain: 6.04,
    });
    assert.equal(item.pp, 160);
});

test("near-FC keeps its evidenced combo and PP instead of assuming FC", () => {
    const display = recommendationPpDisplay({ ...item, practiceTarget: { ...item.practiceTarget, misses: 2, combo: 900, pp: 320 } }, "fruits");
    assert.equal(display.primary, 320);
    assert.equal(display.target, "2 Miss · 900 连击");
});

test("missing evidence or invalid target cannot masquerade as practice PP", () => {
    assert.equal(recommendationPpDisplay({ pp: 160 }, "fruits").primary, undefined);
    assert.equal(recommendationPpDisplay({ ...item, fcEvidence: undefined }, "fruits").primary, undefined);
    assert.equal(recommendationPpDisplay({ ...item, practiceTarget: { ...item.practiceTarget, pp: NaN } }, "fruits").primary, undefined);
});

test("other modes retain their original predicted PP", () => {
    for (const mode of ["osu", "taiko", "mania"]) {
        assert.deepEqual(recommendationPpDisplay(item, mode), { label: "预计 PP", primary: 160, secondary: undefined, target: undefined, weightedGain: undefined });
    }
});

test("weighted gain stays separate from raw PP and needs a valid evidenced target", () => {
    assert.equal(recommendationPpDisplay(item, "fruits").weightedGain, 6.04);
    for (const invalid of [{ ...item, fcEvidence: undefined },
        { ...item, practiceTarget: { ...item.practiceTarget, pp: NaN } },
        { ...item, practiceTarget: { ...item.practiceTarget, weightedGain: Infinity } }]) {
        assert.equal(recommendationPpDisplay(invalid, "fruits").weightedGain, undefined);
    }
});
