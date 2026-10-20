const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

// Exercise the card list built by the editor's actual render, including its
// original indices, without mounting unrelated selectors and network hooks.
const source = readFileSync(`${__dirname}/../app/(home)/tournament-management/[tournament]/scheduler/page.tsx`, "utf8");
const start = source.indexOf("const schedulesForRound =");
const end = source.indexOf("\n                        return (", start);
assert.ok(start >= 0 && end > start);
const compiled = ts.transpileModule(source.slice(start, end), {
    compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText;

async function editorCards(schedules) {
    const visibility = await import("../lib/schedule_possibilities.ts");
    const options = await import("../lib/schedule_options.ts");
    const render = new Function("scheduleInfo", "item", "isScheduleVisible", "sortSchedulesByTime", "getPairingTime", `${compiled}\nreturn scheduleCards;`);
    return render(schedules, {stage_name: "RO16"}, visibility.isScheduleVisible, visibility.sortSchedulesByTime, options.getPairingTime);
}

test("changing or clearing a match time does not move its card during editing", async () => {
    const schedules = [
        {stage_name: "RO16", match_id: "A", match_time: "2026-10-24T12:00:00Z"},
        {stage_name: "RO16", match_id: "B", match_time: null},
    ];
    for (const time of [null, "2026-10-24T10:00:00Z", "2026-10-24T14:00:00Z", null]) {
        schedules[1] = {...schedules[1], match_time: time};
        const cards = await editorCards(schedules);
        assert.deepEqual(cards.map(card => card.schedule.match_id), ["A", "B"]);
        assert.deepEqual(cards.map(card => card.originalIndex), [0, 1]);
    }
});

test("candidate time edits preserve pairing order and the correct underlying edit index", async () => {
    const {setPairingTime} = await import("../lib/schedule_options.ts");
    const first = {team1: "A", team2: "B", match_time: null};
    const second = {team1: "A", team2: "C", match_time: null};
    const schedules = [
        {stage_name: "Other", match_id: "other"},
        {stage_name: "RO16", match_id: "hidden", is_future_pending: true},
        {stage_name: "RO16", match_id: "candidate", match_time: null, possible_pairings: [first, second]},
    ];
    schedules[2] = setPairingTime(schedules[2], second, "2026-10-24T10:00:00Z");
    const cards = await editorCards(schedules);
    assert.deepEqual(cards.map(card => card.possiblePairing.team2), ["B", "C"]);
    assert.deepEqual(cards.map(card => card.possibilityIndex), [0, 1]);
    assert.deepEqual(cards.map(card => card.originalIndex), [2, 2]);
});
