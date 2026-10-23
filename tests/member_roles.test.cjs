const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");

const source = readFileSync(`${__dirname}/../app/(home)/tournament-management/[tournament]/member/page.tsx`, "utf8");
const component = name => Object.assign(() => null, {displayName: name});
const compound = (name, children) => Object.assign(component(name), Object.fromEntries(children.map(child => [child, component(`${name}.${child}`)])));
const ComboBox = compound("ComboBox", ["InputGroup", "Trigger", "Popover"]);
const ListBox = compound("ListBox", ["Item", "ItemIndicator"]);
const Avatar = compound("Avatar", ["Image", "Fallback"]);
const Button = component("Button");

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}

function editor(players, {profile = {id: 456, username: "New Name", statistics: null, country_code: "CN"}, status = 200} = {}) {
    let members = {players, groups: [{name: "Team"}]};
    const state = [];
    let hook = 0;
    const requests = [];
    const alerts = [];
    const roles = source.slice(source.indexOf("const ROLES ="), source.indexOf("// --- 图标 ---"));
    const compiled = ts.transpileModule(`${roles}\n${source.slice(source.indexOf("const AddMember ="), source.indexOf("async function getRegistrationInfo"))}`, {
        compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022},
    }).outputText;
    const stubs = {
        React, ComboBox, ListBox, Avatar, Button,
        Label: component("Label"), Input: component("Input"), Description: component("Description"), EmptyState: component("EmptyState"),
        useState: initial => {
            const index = hook++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => {state[index] = typeof value === "function" ? value(state[index]) : value;}];
        },
        useFilter: () => ({contains: (value, query) => value.toLowerCase().includes(query.toLowerCase())}),
        siteConfig: {backend_url: "http://backend.test"},
        fetch: async url => {requests.push(url); return {status, ok: status === 200, json: async () => profile};},
        alert: message => alerts.push(message),
    };
    const AddMember = new Function(...Object.keys(stubs), `${compiled}\nreturn AddMember;`)(...Object.values(stubs));
    const render = () => {
        hook = 0;
        return AddMember({members: members.players, teams: members.groups, tournamentName: "Cup & Friends", position: "referee",
            setMembers: value => {members = typeof value === "function" ? value(members) : value;}});
    };
    return {
        input: value => elements(render(), node => node.type === ComboBox)[0].props.onInputChange(value),
        select: key => elements(render(), node => node.type === ComboBox)[0].props.onSelectionChange(key),
        add: () => elements(render(), node => node.type === Button)[0].props.onPress(),
        get members() {return members;}, requests, alerts,
    };
}

test("entering a renamed user's new nickname adds the role to their existing UID without duplicating them", async () => {
    const ui = editor([{uid: 456, name: "Old Name", host: true, commentator: true, referee: false}]);
    ui.input("New Name");
    await ui.add();
    assert.equal(ui.members.players.length, 1);
    assert.equal(ui.members.players[0].uid, 456);
    assert.equal(ui.members.players[0].referee, true);
    assert.equal(ui.members.players[0].host, true);
    assert.equal(ui.members.players[0].commentator, true);
    assert.deepEqual(ui.members.groups, [{name: "Team"}]);
});

test("a new member found by nickname uses the API's canonical UID and can have no game statistics", async () => {
    const ui = editor([]);
    ui.input(" [Paw]New Name ");
    await ui.add();
    assert.equal(ui.members.players[0]?.uid, 456);
    assert.equal(ui.members.players[0]?.referee, true);
    assert.equal(ui.members.players[0]?.pp, 0);
    assert.equal(ui.members.players[0]?.rank, 0);
    assert.equal(new URL(ui.requests[0]).searchParams.get("uid"), "[Paw]New Name");
    assert.equal(new URL(ui.requests[0]).searchParams.get("tournament_name"), "Cup & Friends");
});

test("entering an existing UID with whitespace or selecting a member preserves other roles", async () => {
    for (const select of [false, true]) {
        const original = {uid: 456, name: "Old Name", host: true, referee: false};
        const ui = editor([original]);
        if (select) ui.select("456");
        else ui.input(" 456 ");
        await ui.add();
        assert.equal(ui.members.players.length, 1);
        assert.equal(ui.members.players[0].referee, true);
        assert.equal(ui.members.players[0].host, true);
        assert.equal(original.referee, false);
        assert.equal(ui.requests.length, 0);
    }
});

test("a failed user lookup never adds a malformed member", async () => {
    const ui = editor([], {status: 404, profile: {detail: "not found"}});
    ui.input("Unknown");
    await ui.add();
    assert.equal(ui.members.players.length, 0);
    assert.equal(ui.alerts.length, 1);
});

test("adding a role twice never duplicates the user or removes their existing role", async () => {
    const ui = editor([{uid: 456, name: "Old Name", host: true, referee: false}]);
    ui.select("456");
    await ui.add();
    ui.select("456");
    await ui.add();
    assert.equal(ui.members.players.length, 1);
    assert.equal(ui.members.players[0].referee, true);
    assert.equal(ui.members.players[0].host, true);
    assert.equal(ui.alerts.length, 1);
});
