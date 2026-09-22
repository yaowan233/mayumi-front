import assert from "node:assert/strict";
import test from "node:test";
import { profileStyleFilters, referenceRanges, validProfileReference, type ReferenceGroup } from "../lib/profile-reference.ts";
import { personalDefaults, toCustomRequest } from "../lib/recommendation.ts";
import { parseFeatureRanges } from "../lib/recommendation-features.ts";

const group: ReferenceGroup = { key_count: 4, sample_count: 8, features: { ln_ratio: { value: 0.354, min: 0.254, max: 0.454, samples: 8 } } };
const profile = { source: "bp-raw-nm-v1", mode: "mania", player_id: 123, generated_at: "2026-09-10T00:00:00Z", groups: [group] };

test("references validate ownership, mode, key groups and finite bounds", () => {
    assert.ok(validProfileReference(profile, "mania", 123));
    assert.equal(validProfileReference(profile, "osu", 123), false);
    assert.equal(validProfileReference(profile, "mania", 456), false);
    assert.equal(validProfileReference({ ...profile, groups: [group, group] }, "mania", 123), false);
    for (const invalid of [NaN, -1, 2]) {
        assert.equal(validProfileReference({ ...profile, groups: [{ ...group, features: { ln_ratio: { ...group.features.ln_ratio, value: invalid } } }] }, "mania", 123), false);
    }
    assert.ok(validProfileReference({ ...profile, groups: [] }, "mania", 123));
});

test("applying reference ranges is explicit, rounded outwards and does not mutate data", () => {
    const before = JSON.stringify(group);
    const ranges = referenceRanges(group, "mania", ["ln_ratio"]);
    assert.deepEqual(ranges, { ln_ratio: { min: 0.25, max: 0.46 } });
    assert.deepEqual(parseFeatureRanges(JSON.stringify(ranges), "mania"), ranges);
    assert.equal(JSON.stringify(group), before);
    assert.deepEqual(referenceRanges({ ...group, features: {} }, "mania", ["ln_ratio"]), {});
    assert.deepEqual(referenceRanges({ ...group, features: { ln_ratio: { value: 0.5, min: 0, max: 1, samples: 8 } } }, "mania", ["ln_ratio"]), {});
    assert.deepEqual(referenceRanges(group, "mania", []), {});
});

test("one-click profile style never intersects all reference dimensions", () => {
    const filters = { ...personalDefaults(123), mode: "mania" as const, minStars: 4, maxStars: 6, mod: "DT" as const,
        featureRanges: '{"ln_ratio":{"min":0.1,"max":0.6},"note_density_avg":{"min":11.5,"max":17.3}}' };
    const updated = profileStyleFilters(filters, "123", 4);
    const payload = toCustomRequest(updated);
    assert.equal(payload.feature_ranges, undefined);
    assert.equal(payload.target, "style");
    assert.deepEqual(payload.key_counts, [4]);
    assert.equal(updated.minStars, 4);
    assert.equal(updated.maxStars, 6);
    assert.equal(updated.mod, "DT");
    assert.notEqual(filters.featureRanges, "{}");
});
