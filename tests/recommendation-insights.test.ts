import test from "node:test";
import assert from "node:assert/strict";
import { loadRecommendationReference, recommendationInsights } from "../lib/recommendation-insights.ts";
import { personalDefaults, type Recommendation } from "../lib/recommendation.ts";
import type { ProfileReference } from "../lib/profile-reference.ts";

const filters = { ...personalDefaults(123), mode: "mania" as const, target: "peak" as const };
const item: Recommendation = { id: 1, title: "test", artist: "", version: "", stars: 6, seconds: 100, keys: 4,
    mods: "DT", featureValues: { ln_ratio: 0.45, note_density_avg: 12 }, reasons: { average_pattern_fit: 0.8 } };
const profile: ProfileReference = { source: "bp-raw-nm-v1", player_id: 123, mode: "mania", generated_at: "2026-09-11T00:00:00Z",
    groups: [{ key_count: 4, sample_count: 10, features: {
        ln_ratio: { value: 0.35, min: 0.25, max: 0.45, samples: 10 },
        note_density_avg: { value: 10, min: 8, max: 12, samples: 10 },
    } }] };

test("same-key comparisons use percentage points and raw NM density even with DT", () => {
    const before = JSON.stringify(item);
    const result = recommendationInsights(item, filters, profile);
    assert.match(result.reason, /进阶练习候选/);
    assert.match(result.reason, /长条占比更高/);
    assert.doesNotMatch(result.reason, /风格匹配|\/100/);
    assert.match(result.comparisons[0].detail, /这张图 45.0 %，BP 参考 35.0 %/);
    assert.match(result.comparisons[0].detail, /每 100 个物件/);
    assert.match(result.comparisons[0].text, /高 10.0 百分点/);
    assert.match(result.comparisons[1].text, /高 2.0 个\/秒/);
    assert.deepEqual(result.comparisons.map(row => row.compact), ["长条占比 +29%", "密度 +20%"]);
    assert.equal(JSON.stringify(item), before);
});

test("different keys, identities and modes never reuse a reference", () => {
    assert.equal(recommendationInsights({ ...item, keys: 7 }, filters, profile).comparisons.length, 0);
    assert.equal(recommendationInsights(item, { ...filters, uid: "456" }, profile).comparisons.length, 0);
    assert.equal(recommendationInsights(item, { ...filters, mode: "osu" }, profile).comparisons.length, 0);
    assert.equal(recommendationInsights(item, filters).comparisons.length, 0);
});

test("missing, invalid and zero features are distinguished", () => {
    assert.equal(recommendationInsights({ ...item, featureValues: {} }, filters, profile).comparisons.length, 0);
    assert.equal(recommendationInsights({ ...item, featureValues: { ln_ratio: NaN } }, filters, profile).comparisons.length, 0);
    assert.match(recommendationInsights({ ...item, featureValues: { ln_ratio: 0 } }, filters, profile).comparisons[0].text, /低 35.0/);
    assert.match(recommendationInsights({ ...item, featureValues: { ln_ratio: 0.35 } }, filters, profile).comparisons[0].text, /接近/);
});

for (const [mode, feature] of [["osu", "jump_p90"], ["taiko", "color_change_ratio"], ["fruits", "direction_change_ratio"]] as const) {
    test(`${mode} compares its own feature group`, () => {
        const reference: ProfileReference = { ...profile, mode, groups: [{ key_count: null, sample_count: 10,
            features: { [feature]: { value: 0.3, min: 0.2, max: 0.4, samples: 10 } } }] };
        const result = recommendationInsights({ ...item, featureValues: { [feature]: 0.4 } }, { ...filters, mode }, reference);
        assert.equal(result.comparisons[0].key, feature);
        assert.match(result.comparisons[0].detail, /BP/);
        if (mode === "fruits") {
            assert.equal(result.comparisons[0].compact, "折返占比 +33%");
            assert.match(result.comparisons[0].detail, /从向左移动改为向右/);
        }
        if (mode === "taiko") assert.equal(result.comparisons[0].compact, "换色占比 +33%");
    });
}

test("optional profile failure does not fail recommendations; discovery makes no request", async context => {
    let calls = 0;
    context.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("offline"); });
    const signal = new AbortController().signal;
    assert.equal(await loadRecommendationReference("http://localhost", {}, filters, signal), undefined);
    assert.equal(await loadRecommendationReference("http://localhost", {}, { ...filters, source: "conditions" }, signal), undefined);
    assert.equal(calls, 1);
});

test("compact comparisons handle zero BP baselines and negative ratio changes", () => {
    const noLongNotes: ProfileReference = { ...profile, groups: [{ key_count: 4, sample_count: 10, features: {
        ln_ratio: { value: 0, min: 0, max: 0, samples: 10 },
        note_density_avg: { value: 0, min: 0, max: 0, samples: 10 },
    } }] };
    const result = recommendationInsights(item, filters, noLongNotes);
    assert.deepEqual(result.comparisons.map(row => row.compact), ["长条占比 45%（BP 0）", "密度 +12.0 个/秒"]);
    const lower = recommendationInsights({ ...item, featureValues: { ln_ratio: 0.25 } }, filters, profile);
    assert.equal(lower.comparisons[0].compact, "长条占比 -29%");
    const same = recommendationInsights({ ...item, featureValues: { ln_ratio: 0.35 } }, filters, profile);
    assert.equal(same.comparisons[0].compact, "长条占比 ≈ BP");
});

test("CTB horizontal spacing uses a relative percentage", () => {
    const reference: ProfileReference = { ...profile, mode: "fruits", groups: [{ key_count: null, sample_count: 10,
        features: { x_jump_p90: { value: 100, min: 50, max: 200, samples: 10 } } }] };
    const result = recommendationInsights({ ...item, featureValues: { x_jump_p90: 120 } }, { ...filters, mode: "fruits" }, reference);
    assert.equal(result.comparisons[0].compact, "横向间距 +20%");
    assert.match(result.comparisons[0].detail, /120.0.*100.0/);
});

test("STD shows short BP-relative tags and keeps raw numbers in details", () => {
    const reference: ProfileReference = { ...profile, mode: "osu", groups: [{ key_count: null, sample_count: 10,
        features: { jump_p90: { value: 219.7, min: 100, max: 300, samples: 10 },
            object_density_avg: { value: 3.5, min: 1, max: 8, samples: 10 } } }] };
    const result = recommendationInsights({ ...item, featureValues: { jump_p90: 228.8, object_density_avg: 4.5 } },
        { ...filters, mode: "osu" }, reference);
    assert.deepEqual(result.comparisons.map(row => row.compact), ["跳距 +4%", "密度 +29%"]);
    assert.match(result.comparisons[0].detail, /228.8.*219.7/);
    assert.match(result.comparisons[1].detail, /4.5.*3.5/);
    const equal = recommendationInsights({ ...item, featureValues: { jump_p90: 219.7 } }, { ...filters, mode: "osu" }, reference);
    assert.equal(equal.comparisons[0].compact, "跳距 ≈ BP");
    const lower = recommendationInsights({ ...item, featureValues: { object_density_avg: 1.75 } }, { ...filters, mode: "osu" }, reference);
    assert.equal(lower.comparisons[0].compact, "密度 -50%");
});
