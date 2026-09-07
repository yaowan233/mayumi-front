import assert from "node:assert/strict";
import test from "node:test";
import {fromBeijingDateTimeInput, getRegistrationState, registrationTimeError, splitTournamentsByTime, toBeijingDateTimeInput} from "../lib/tournament_timing.ts";

const tournament = {
    name: "HLC-ALLSTAR 2026",
    registration_start_time: "2026-11-30T16:00:00.000Z",
    start_date: "2027-01-01", end_date: "2027-01-31",
};

test("registration opens at the configured instant, not when the event is published", () => {
    assert.equal(getRegistrationState(tournament, Date.parse("2026-09-07T00:00:00Z")), "upcoming");
    assert.equal(getRegistrationState(tournament, Date.parse("2026-11-30T15:59:59.999Z")), "upcoming");
    assert.equal(getRegistrationState(tournament, Date.parse("2026-11-30T16:00:00Z")), "open");
    assert.equal(getRegistrationState(tournament, Date.parse("2027-01-01T00:00:00Z")), "closed");
});

test("future registration is separated from ongoing and finished tournaments", () => {
    const ongoing = {...tournament, name: "Open cup", registration_start_time: null};
    const finished = {...tournament, name: "Old cup", start_date: "2026-01-01", end_date: "2026-02-01"};
    const input = [ongoing, tournament, finished];
    const result = splitTournamentsByTime(input, Date.parse("2026-09-07T00:00:00Z"));
    assert.deepEqual(result.upcoming, [tournament]);
    assert.deepEqual(result.ongoing, [ongoing]);
    assert.deepEqual(result.finished, [finished]);
    assert.deepEqual(input, [ongoing, tournament, finished]);
    assert.equal(splitTournamentsByTime([tournament], Date.parse(tournament.registration_start_time)).ongoing.length, 1);
});

test("existing events without a registration start keep their previous availability", () => {
    for (const registration_start_time of [null, undefined]) {
        assert.equal(getRegistrationState({...tournament, registration_start_time}, Date.parse("2026-09-07T00:00:00Z")), "open");
    }
});

test("Beijing datetime input round-trips across the UTC date boundary", () => {
    assert.equal(fromBeijingDateTimeInput("2026-12-01T00:00"), tournament.registration_start_time);
    assert.equal(toBeijingDateTimeInput(tournament.registration_start_time), "2026-12-01T00:00");
    assert.equal(fromBeijingDateTimeInput(""), null);
    assert.equal(toBeijingDateTimeInput(null), "");
});

test("registration cannot begin at or after its cutoff", () => {
    assert.equal(registrationTimeError(tournament), null);
    assert.ok(registrationTimeError({...tournament, registration_start_time: "2027-01-01T00:00:00Z"}));
    assert.ok(registrationTimeError({...tournament, registration_start_time: "invalid"}));
});
