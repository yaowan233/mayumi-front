import assert from "node:assert/strict";
import test from "node:test";
import { defaults, personalDefaults, matchesFilters, modOptions, parseFilters, toCustomRequest, type Recommendation } from "../lib/recommendation.ts";

test("signed-in page defaults to the current player with engine-selected difficulty", () => {
    const filters = personalDefaults(123);
    assert.equal(filters.source, "personal");
    assert.equal(filters.uid, "123");
    assert.equal(filters.minStars, 0);
    assert.equal(filters.maxStars, 20);
    assert.equal(filters.maxLength, 3600);
    assert.equal(filters.mod, "any");
    assert.deepEqual(parseFilters(new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]))), filters);
    filters.uid = "456";
    assert.equal(personalDefaults(123).uid, "123");
});

const item: Recommendation = { id: 1, title: "Voyager", artist: "Artist", version: "Hard", stars: 5, seconds: 180, bpm: 180, mods: "NM" };

test("taiko combination mods survive request and response filtering", () => {
    const filters = parseFilters(new URLSearchParams("source=personal&uid=123&mode=taiko&mod=any&includeConverts=true"));
    assert.equal(toCustomRequest(filters).mods.length, 7);
    assert.equal(toCustomRequest(filters).include_converts, true);
    for (const mod of ["DTHR", "HDHRDT"]) {
        assert.ok(!toCustomRequest(filters).mods.includes(mod));
        assert.ok(matchesFilters({ ...item, mods: mod }, filters));
        assert.deepEqual(toCustomRequest(parseFilters(new URLSearchParams(`mode=taiko&mod=${mod}`))).mods, [mod]);
        assert.throws(() => parseFilters(new URLSearchParams(`mode=mania&mod=${mod}`)));
        assert.throws(() => parseFilters(new URLSearchParams(`mode=osu&referenceId=1&referenceMod=${mod}`)));
    }
});

test("multiple Mod combinations reach the engine and strictly filter results", () => {
    for (const mode of ["osu", "taiko", "fruits", "mania"]) {
        for (const source of ["personal", "conditions"]) {
            const selection = mode === "mania" ? "HT,NM,DT" : "HD,NM,DT";
            const expected = mode === "mania" ? ["NM", "DT", "HT"] : ["NM", "DT", "HD"];
            const filters = parseFilters(new URLSearchParams({ source, uid: "123", mode, mod: "any", modSelections: selection }));
            assert.deepEqual(toCustomRequest(filters).mods, expected);
            for (const mod of expected) assert.ok(matchesFilters({ ...item, mods: mod }, filters));
            assert.equal(matchesFilters({ ...item, mods: "HDDT" }, filters), false);
        }
    }
    const taiko = parseFilters(new URLSearchParams("mode=taiko&mod=any&modSelections=DTHR,HDHRDT"));
    assert.deepEqual(toCustomRequest(taiko).mods, ["DTHR", "HDHRDT"]);
    for (const selection of ["HD,HD", "NM,", "any", "EZ", "DTHR"]) {
        assert.throws(() => parseFilters(new URLSearchParams({ mode: "mania", mod: "any", modSelections: selection })));
    }
    assert.throws(() => parseFilters(new URLSearchParams("mod=NM&modSelections=HD,DT")));
});

test("personal defaults preserve engine defaults with Mania limited to speed mods", () => {
    for (const mode of ["osu", "taiko", "fruits", "mania"] as const) {
        assert.deepEqual(toCustomRequest(personalDefaults(3162675, mode)), {
            player_id: 3162675, mode, target: "balanced", candidate_limit: 500, result_limit: 20,
            min_stars: 0, max_stars: 20, max_length: 3600,
            mods: mode === "mania" ? ["NM", "DT", "HT"] : ["NM", "DT", "HT", "HD", "HR", "HDDT", "HDHR"],
            exclude_recorded_plays: true, include_converts: ["fruits", "taiko"].includes(mode),
        });
        assert.deepEqual(toCustomRequest(parseFilters(new URLSearchParams(`source=personal&uid=3162675&mode=${mode}`))),
            toCustomRequest(personalDefaults(3162675, mode)));
    }
});

test("Mania only exposes and accepts NM DT HT in all Mod selectors", () => {
    assert.deepEqual(modOptions("mania"), ["NM", "DT", "HT"]);
    for (const mod of ["HD", "HR", "HDDT", "HDHR", "DTHR", "HDHRDT"]) {
        assert.throws(() => parseFilters(new URLSearchParams({ mode: "mania", mod })));
        assert.throws(() => parseFilters(new URLSearchParams({ mode: "mania", mod: "any", modSelections: `NM,${mod}` })));
        assert.throws(() => parseFilters(new URLSearchParams({ mode: "mania", referenceId: "1", referenceMod: mod })));
        assert.equal(matchesFilters({ ...item, mods: mod }, personalDefaults(123, "mania")), false);
    }
});

test("recorded scores remain excluded unless replay is requested", () => {
    assert.equal(toCustomRequest(personalDefaults(123)).exclude_recorded_plays, true);
    const filters = parseFilters(new URLSearchParams("source=personal&uid=123&mode=taiko&excludeRecordedPlays=false"));
    assert.equal(toCustomRequest(filters).exclude_recorded_plays, false);
    assert.throws(() => parseFilters(new URLSearchParams("excludeRecordedPlays=0")));
});

test("mania exposes 4K through 10K and preserves exact key filters", () => {
    for (const keys of [4, 5, 6, 7, 8, 9, 10]) {
        const filters = parseFilters(new URLSearchParams(`mode=mania&keys=${keys}`));
        assert.equal(toCustomRequest(filters).key_count, keys);
        assert.ok(matchesFilters({ ...item, keys }, filters));
        assert.ok(!matchesFilters({ ...item, keys: keys + 1 }, filters));
        assert.throws(() => parseFilters(new URLSearchParams(`mode=osu&keys=${keys}`)));
    }
    for (const keys of [-1, 1, 2, 3, 4.5, 11]) {
        assert.throws(() => parseFilters(new URLSearchParams(`mode=mania&keys=${keys}`)));
    }
    assert.equal(toCustomRequest(parseFilters(new URLSearchParams("mode=mania&keys=0"))).key_count, null);
});

test("catch excludes converts unless explicitly enabled", () => {
    assert.equal(toCustomRequest(parseFilters(new URLSearchParams("mode=fruits"))).include_converts, false);
    assert.equal(toCustomRequest(parseFilters(new URLSearchParams("mode=fruits&includeConverts=true"))).include_converts, true);
    assert.throws(() => parseFilters(new URLSearchParams("includeConverts=1")));
});

test("defaults and boundary values match", () => {
    assert.deepEqual(parseFilters(new URLSearchParams()), defaults);
    assert.ok(matchesFilters(item, { ...defaults, minStars: 5, maxStars: 5, maxLength: 180 }));
    assert.ok(!matchesFilters(item, { ...defaults, maxLength: 179 }));
});
test("invalid and unsupported filters fail instead of being ignored", () => {
    for (const query of ["minStars=7&maxStars=3", "minStars=NaN", "minStars=", "mode=unknown", "source=personal&uid=../admin", "keys=4", "query=foo", "preferredStars=10", "referenceMod=DT", "diversity=0.8"]) {
        assert.throws(() => parseFilters(new URLSearchParams(query)), query);
    }
});

test("custom payload carries hard conditions, profile, reference and preferences to the engine", () => {
    const filters = parseFilters(new URLSearchParams("mode=mania&keys=4&mod=DT&minBpm=100&preferredStars=4.5&referenceId=321&referenceMod=HT"));
    const payload = toCustomRequest(filters);
    assert.equal(payload.player_id, null);
    assert.equal(payload.key_count, 4);
    assert.equal(payload.min_bpm, 100);
    assert.deepEqual(payload.mods, ["DT"]);
    assert.equal(payload.reference_beatmap_id, 321);
    assert.equal(payload.reference_mod, "HT");
    assert.equal(payload.preferred_stars, 4.5);
    assert.equal(payload.preferred_bpm, null);
    assert.equal(toCustomRequest({ ...defaults, uid: "123" }).player_id, null);
    assert.deepEqual(toCustomRequest({ ...defaults, mod: "any" }).mods, ["NM", "DT", "HT"]);
});
test("personal targets use the full engine payload without discovery preferences", () => {
    for (const target of ["farm", "balanced", "peak", "style"]) {
        const filters = parseFilters(new URLSearchParams(`source=personal&uid=123&target=${target}&mod=any`));
        const payload = toCustomRequest(filters);
        assert.equal(payload.player_id, 123);
        assert.equal(payload.target, target);
        assert.equal(payload.mods.length, 7);
        assert.equal(payload.include_converts, false);
    }
    assert.throws(() => parseFilters(new URLSearchParams("source=personal&uid=123&referenceId=321")));
    assert.throws(() => parseFilters(new URLSearchParams("source=personal&uid=123&diversity=0.1")));
    assert.throws(() => parseFilters(new URLSearchParams("target=farm")));
});
test("missing data is not fabricated and key filters are strict", () => {
    assert.ok(!matchesFilters({ ...item, seconds: NaN }, defaults));
    assert.ok(!matchesFilters({ ...item, bpm: undefined }, { ...defaults, minBpm: 100 }));
    assert.ok(!matchesFilters(item, { ...defaults, mode: "mania", keys: 4 }));
});
test("legacy keyword matching is case insensitive and custom mods are exact", () => {
    assert.ok(matchesFilters(item, { ...defaults, query: "VOYAGER hard" }));
    assert.ok(!matchesFilters(item, { ...defaults, query: "other" }));
    assert.ok(!matchesFilters({ ...item, mods: "HDNC" }, { ...defaults, mod: "DT" }));
    assert.ok(matchesFilters({ ...item, mods: "HDDT" }, { ...defaults, mod: "HDDT" }));
    assert.ok(!matchesFilters({ ...item, mods: "HD" }, { ...defaults, mod: "any" }));
    assert.ok(!matchesFilters({ ...item, mods: "HD" }, { ...defaults, mod: "NM" }));
});
