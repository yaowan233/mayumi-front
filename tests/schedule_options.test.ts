import assert from "node:assert/strict";
import test from "node:test";
import {getPairingTime, setPairingTime} from "../lib/schedule_options.ts";

test("candidate times survive separate edits and a save/reload", () => {
    const ab = {team1: "A", team2: "B"};
    const ac = {team1: "A", team2: "C"};
    const initial = {match_time: null, possible_match_times: []};
    const first = setPairingTime(initial, ab, "2026-10-17T12:00:00Z");
    const both = setPairingTime(first, ac, "2026-10-17T13:00:00Z");
    const reloaded = JSON.parse(JSON.stringify(both));
    assert.equal(getPairingTime(reloaded, ab), "2026-10-17T12:00:00Z");
    assert.equal(getPairingTime(reloaded, ac), "2026-10-17T13:00:00Z");
    const cleared = setPairingTime(reloaded, ab, null);
    assert.equal(getPairingTime(cleared, ab), null);
    assert.equal(getPairingTime(cleared, ac), "2026-10-17T13:00:00Z");
    assert.equal(both.possible_match_times.length, 2);
    assert.deepEqual(initial.possible_match_times, []);
});

test("existing common time is the default until a candidate is explicitly rescheduled", () => {
    const ab = {team1: "A", team2: "B"};
    const ac = {team1: "A", team2: "C"};
    const existing = {match_time: "2026-10-17T12:00:00Z", possible_pairings: [ab, ac]};
    const changed = setPairingTime(existing, ab, "2026-10-17T14:00:00Z");
    assert.equal(getPairingTime(changed, ab), "2026-10-17T14:00:00Z");
    assert.equal(getPairingTime(changed, ac), existing.match_time);
    const resolved = {...changed, match_time: "2026-10-17T14:00:00Z", possible_pairings: []};
    assert.equal(getPairingTime(resolved, ac), existing.match_time);
    assert.equal(getPairingTime(existing, {...ac, match_time: null}), null);
});
