const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

const source = readFileSync(`${__dirname}/../app/(home)/tournament-management/[tournament]/member/page.tsx`, "utf8");
const start = source.indexOf("const handleRefreshStats =");
const end = source.indexOf("const handleSave =", start);
const compiled = ts.transpileModule(source.slice(start, end), {
    compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText;

test("refreshing a renamed member updates their profile while retaining unsaved referee assignments", async () => {
    const group = {name: "Team", members: [456]};
    const unsaved = {uid: 789, name: "New Staff", referee: true};
    let members = {players: [{uid: 456, name: "Old Name", referee: true, commentator: false, pp: 100}, unsaved], groups: [group]};
    const stubs = {
        tournamentName: "Cup", siteConfig: {backend_url: "http://backend.test"}, setIsRefreshing: () => {}, alert: () => {},
        fetch: async () => ({ok: true, json: async () => ({updated: 1, total: 1})}),
        getPlayers: async () => ({players: [{uid: 456, name: "New Name", referee: false, commentator: true, pp: 200, rank: 500, country: "CN", default_mode: "mania"}]}),
        setTournamentPlayers: value => {members = typeof value === "function" ? value(members) : value;},
    };
    const refresh = new Function(...Object.keys(stubs), `${compiled}\nreturn handleRefreshStats;`)(...Object.values(stubs));
    await refresh();
    assert.equal(members.players[0].name, "New Name");
    assert.equal(members.players[0].referee, true);
    assert.equal(members.players[0].commentator, false);
    assert.equal(members.players[0].pp, 200);
    assert.equal(members.players[0].default_mode, "mania");
    assert.equal(members.players[1], unsaved);
    assert.deepEqual(members.groups, [group]);
});
