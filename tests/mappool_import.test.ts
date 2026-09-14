import assert from "node:assert/strict";
import test from "node:test";
import {importMappoolIds, type TournamentMap} from "../lib/mappool_import.ts";

const context = {tournament_name: "Cup", stage_name: "Finals", mode: "osu"};

test("imports space, newline, CRLF and tab separated IDs in order with complete map fields", () => {
    const result = importMappoolIds("  123  456\r\n789\n\t101\u3000202  ", " nm ", context, []);
    assert.deepEqual(result.maps, [123, 456, 789, 101, 202].map((map_id, index) => ({
        ...context, mod: "NM", map_id, number: index + 1, extra: [],
    })));
    assert.equal(result.skipped, 0);
});

test("invalid or empty input rejects the whole batch without changing existing maps", () => {
    const existing = [{...context, mod: "NM", map_id: 123, number: 1}];
    const before = structuredClone(existing);
    for (const token of ["abc", "123abc", "1.5", "0", "-1", "1e3", "0x10", "123,456", "9007199254740992"]) {
        assert.throws(() => importMappoolIds(`456 ${token}`, "NM", context, existing), /正整数/);
    }
    assert.throws(() => importMappoolIds(" \r\n\t", "NM", context, existing), /请输入/);
    assert.throws(() => importMappoolIds("456", " ", context, existing), /Mod/);
    assert.deepEqual(existing, before);
});

test("skips duplicates and continues numbering only within the target round and mod", () => {
    const existing: TournamentMap[] = [
        {...context, mod: "NM", map_id: 123, number: 2},
        {...context, mod: "NM", map_id: 456, number: 5},
        {...context, mod: "HD", map_id: 789, number: 20},
        {...context, stage_name: "Semifinals", mod: "NM", map_id: 101, number: 30},
    ];
    const before = structuredClone(existing);
    const result = importMappoolIds("123 789\n00789 101 456", "NM", context, existing);
    assert.deepEqual(result.maps.map(({map_id, number}) => ({map_id, number})), [
        {map_id: 789, number: 6}, {map_id: 101, number: 7},
    ]);
    assert.equal(result.skipped, 3);
    assert.deepEqual(existing, before);
    assert.deepEqual(importMappoolIds("123 456", "NM", context, existing), {maps: [], skipped: 2});
});
