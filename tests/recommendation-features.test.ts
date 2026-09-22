import assert from "node:assert/strict";
import test from "node:test";
import { featureSpecs, parseFeatureRanges, withRatioRange } from "../lib/recommendation-features.ts";
import { defaults, matchesFilters, parseFilters, toCustomRequest } from "../lib/recommendation.ts";

test("ratio handles convert percentages and full range clears only that condition", () => {
    const ranges = withRatioRange({ chord_ratio: { min: 0.2 } }, "ln_ratio", [20, 60]);
    assert.deepEqual(ranges.ln_ratio, { min: 0.2, max: 0.6 });
    assert.deepEqual(withRatioRange(ranges, "ln_ratio", [0, 100]), { chord_ratio: { min: 0.2 } });
    assert.deepEqual(withRatioRange({}, "ln_ratio", [0, 0]), { ln_ratio: { min: 0, max: 0 } });
    for (const values of [[70, 20], [-1, 20], [0, 101], [0, NaN], [0]]) assert.throws(() => withRatioRange({}, "ln_ratio", values));
});

test("multiple key counts are combined as a union for both sources", () => {
    for (const source of ["conditions", "personal"]) {
        const filters = parseFilters(new URLSearchParams({ source, uid: "123", mode: "mania", keyCounts: "7,4" }));
        assert.equal(filters.keyCounts, "4,7");
        assert.deepEqual(toCustomRequest(filters).key_counts, [4, 7]);
        const item = { id: 1, title: "", artist: "", version: "", stars: 4, seconds: 100, mods: "NM" };
        for (const keys of [4, 7]) assert.ok(matchesFilters({ ...item, keys }, filters));
        for (const keys of [5, undefined]) assert.equal(matchesFilters({ ...item, keys }, filters), false);
    }
    for (const query of ["mode=osu&keyCounts=4", "mode=mania&keys=4&keyCounts=7", "mode=mania&keyCounts=4,4", "mode=mania&keyCounts=3", "mode=mania&keyCounts=4,", "mode=mania&keyCounts=11"]) assert.throws(() => parseFilters(new URLSearchParams(query)));
    assert.deepEqual(toCustomRequest(defaults).key_counts, []);
});

test("all four modes carry feature ranges through both recommendation paths", () => {
    for (const [mode, specs] of Object.entries(featureSpecs)) {
        for (const spec of specs) {
            for (const source of ["conditions", "personal"]) {
                const ranges = { [spec.key]: { min: 0, max: spec.max } };
                const params = new URLSearchParams({ mode, source, uid: "123", featureRanges: JSON.stringify(ranges) });
                assert.deepEqual(toCustomRequest(parseFilters(params)).feature_ranges, ranges);
            }
        }
    }
});

test("invalid, cross-mode, non-numeric and reversed ranges are rejected", () => {
    for (const raw of ["null", "[]", "broken", '{"ln_ratio":{}}', '{"ln_ratio":{"min":null}}', '{"ln_ratio":{"min":true}}',
        '{"ln_ratio":{"min":"0.2"}}', '{"ln_ratio":{"min":-0.1}}', '{"ln_ratio":{"max":1.01}}',
        '{"ln_ratio":{"min":0.8,"max":0.2}}', '{"ln_ratio":{"extra":0}}', '{"slider_ratio":{"min":0}}']) {
        assert.throws(() => parseFeatureRanges(raw, "mania"), raw);
    }
    assert.throws(() => parseFeatureRanges(" ".repeat(4097), "osu"));
});

test("active ranges reject missing values and preserve inclusive boundaries", () => {
    const filters = { ...defaults, mode: "mania" as const, featureRanges: '{"ln_ratio":{"min":0.2,"max":0.6}}' };
    const item = { id: 1, title: "", artist: "", version: "", stars: 4, seconds: 100, mods: "NM" };
    assert.equal(matchesFilters(item, filters), false);
    for (const value of [0.2, 0.6]) assert.ok(matchesFilters({ ...item, featureValues: { ln_ratio: value } }, filters));
    for (const value of [0.19, 0.61, NaN]) assert.equal(matchesFilters({ ...item, featureValues: { ln_ratio: value } }, filters), false);
    assert.ok(matchesFilters(item, { ...filters, featureRanges: "{}" }));
});
