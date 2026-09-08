import assert from "node:assert/strict";
import test from "node:test";
import {fetchTournamentSummaries, tournamentSummary} from "../lib/tournament_summary.ts";

test("homepage payload keeps card fields without carrying full tournament rules", () => {
    const card = {name: "Cup", abbreviation: "cup", description: "Description", start_date: "2027-01-01", registration_start_time: null, end_date: "2027-02-01", pic_url: "", mode: "osu", status: "approved"};
    const full = {...card, rules_info: "Large rules document".repeat(5000), staff_registration_info: "Staff details"};
    const result = tournamentSummary(full);
    assert.deepEqual(result, card);
    assert.ok(JSON.stringify(result).length < JSON.stringify(full).length / 100);
    assert.ok(full.rules_info.length > 0);
});

test("rolling deployment falls back only for a missing summary endpoint", async () => {
    const originalFetch = globalThis.fetch;
    const requests: {url: string; credentials?: RequestCredentials}[] = [];
    try {
        globalThis.fetch = async (url, options) => {
            requests.push({url: String(url), credentials: options?.credentials});
            return new Response(String(url).endsWith("summaries") ? "{}" : "[]", {status: String(url).endsWith("summaries") ? 404 : 200});
        };
        assert.deepEqual(await fetchTournamentSummaries("https://example.com", {credentials: "include"}), []);
        assert.deepEqual(requests, [{url: "https://example.com/api/tournament-summaries", credentials: "include"}, {url: "https://example.com/api/tournaments", credentials: "include"}]);
        globalThis.fetch = async () => new Response("{}", {status: 403});
        await assert.rejects(fetchTournamentSummaries("https://example.com"), /403/);
    } finally { globalThis.fetch = originalFetch; }
});
