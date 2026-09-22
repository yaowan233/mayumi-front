import assert from "node:assert/strict";
import test from "node:test";
import { activeFilterChips } from "../lib/recommendation-ux.ts";
import { defaults, personalDefaults } from "../lib/recommendation.ts";

test("default recommendations have no custom-condition chips", () => {
    assert.deepEqual(activeFilterChips(personalDefaults(123), 123), []);
    assert.deepEqual(activeFilterChips(defaults, 123), []);
});

test("chips remove only their own feature and preserve the rest", () => {
    const filters = { ...personalDefaults(123), mode: "mania" as const, keyCounts: "4,7", featureRanges: '{"ln_ratio":{"min":0.2,"max":0.6},"chord_ratio":{"max":0.3}}' };
    const chips = activeFilterChips(filters, 123);
    assert.equal(chips.find(chip => chip.key === "keys")?.label, "4K / 7K");
    const removed = { ...filters, ...chips.find(chip => chip.key === "ln_ratio")!.reset };
    assert.equal(removed.keyCounts, "4,7");
    assert.deepEqual(JSON.parse(removed.featureRanges), { chord_ratio: { max: 0.3 } });
    assert.ok(!activeFilterChips(removed, 123).some(chip => chip.key === "ln_ratio"));
});

test("basic filters and custom players reset to source-specific defaults", () => {
    for (const base of [defaults, personalDefaults(123)]) {
        const filters = { ...base, uid: "456", minStars: 4, maxStars: 5, maxLength: 120, mod: "DT" as const };
        const chips = activeFilterChips(filters, 123);
        assert.deepEqual(chips.find(chip => chip.key === "stars")?.reset, { minStars: base.minStars, maxStars: base.maxStars, preferredStars: "" });
        assert.equal(chips.find(chip => chip.key === "length")?.reset.maxLength, base.maxLength);
        assert.equal(chips.find(chip => chip.key === "mod")?.reset.mod, base.mod);
        if (base.source === "personal") assert.equal(chips.find(chip => chip.key === "uid")?.reset.uid, "123");
    }
});
