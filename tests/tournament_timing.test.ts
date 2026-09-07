import assert from "node:assert/strict";
import test from "node:test";
import {getRegistrationState, registrationTimeError, splitTournamentsByTime} from "../lib/tournament_timing.ts";

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

test("datetime cutoff preserves the exact instant", () => {
    const timed = {...tournament, start_date: "2027-01-01T18:30:00+08:00"};
    assert.equal(getRegistrationState(timed, Date.parse("2027-01-01T10:29:59.999Z")), "open");
    assert.equal(getRegistrationState(timed, Date.parse("2027-01-01T10:30:00Z")), "closed");
});

test("registration cannot begin at or after its cutoff", () => {
    assert.equal(registrationTimeError(tournament), null);
    assert.ok(registrationTimeError({...tournament, registration_start_time: "2027-01-01T00:00:00Z"}));
    assert.ok(registrationTimeError({...tournament, registration_start_time: "invalid"}));
});

test("schedule datetime helpers round-trip tournament inputs in multiple local timezones", async () => {
    const {localDateTimeInputToUtc, utcDateTimeToLocalInput, formatLocalDateTime} = await import("../lib/datetime.ts");
    const original = process.env.TZ;
    try {
        for (const [zone, local] of [["Asia/Shanghai", "2026-12-01T00:00"], ["America/New_York", "2026-11-30T11:00"], ["UTC", "2026-11-30T16:00"]]) {
            process.env.TZ = zone;
            assert.equal(utcDateTimeToLocalInput(tournament.registration_start_time), local);
            assert.equal(localDateTimeInputToUtc(local), tournament.registration_start_time);
            assert.ok(formatLocalDateTime(tournament.registration_start_time));
        }
    } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
    }
});
