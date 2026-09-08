import assert from "node:assert/strict";
import test from "node:test";
import {tournamentSummary} from "../lib/tournament_summary.ts";

test("homepage payload keeps card fields without carrying full tournament rules", () => {
    const card = {name: "Cup", abbreviation: "cup", description: "Description", start_date: "2027-01-01", registration_start_time: null, end_date: "2027-02-01", pic_url: "", mode: "osu", status: "approved"};
    const full = {...card, rules_info: "Large rules document".repeat(5000), staff_registration_info: "Staff details"};
    const result = tournamentSummary(full);
    assert.deepEqual(result, card);
    assert.ok(JSON.stringify(result).length < JSON.stringify(full).length / 100);
    assert.ok(full.rules_info.length > 0);
});
