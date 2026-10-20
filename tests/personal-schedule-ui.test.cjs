const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");

const source = readFileSync(`${__dirname}/../components/schedule_comp.tsx`, "utf8");
const component = name => Object.assign(() => null, {displayName: name});
const Accordion = Object.assign(component("Accordion"), Object.fromEntries(
    ["Item", "Heading", "Trigger", "Indicator", "Panel", "Body"].map(name => [name, component(name)]),
));
const Card = Object.assign(component("Card"), Object.fromEntries(
    ["Header", "Content"].map(name => [name, component(name)]),
));

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}

async function renderComponents(uid) {
    const {partitionMyMatches} = await import("../lib/personal-schedule.ts");
    const {expandMatchPossibilities} = await import("../lib/schedule_possibilities.ts");
    const chunks = [
        source.slice(source.indexOf("const PersonalScheduleSection ="), source.indexOf("const VSInfoComp =")),
        source.slice(source.indexOf("const GroupComp ="), source.indexOf("// ---------------------- 人员组件重构")),
    ].join("\n");
    const compiled = ts.transpileModule(chunks, {compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022}}).outputText;
    const stubs = {
        React, Accordion, Card, Chip: component("Chip"), Separator: component("Separator"),
        Tooltip: Object.assign(component("Tooltip"), {Trigger: component("Tooltip.Trigger"), Content: component("Tooltip.Content")}),
        useContext: () => ({currentUser: uid === undefined ? null : {uid}}), CurrentUserContext: {},
        partitionMyMatches, expandMatchPossibilities,
        VSInfoComp: component("VSInfoComp"), MatchInfoComp: component("MatchInfoComp"),
        PersonInfo: component("PersonInfo"), WithDeletePersonInfo: component("WithDeletePersonInfo"),
        ParticipantJoinHere: component("ParticipantJoinHere"), LinkIcon: component("LinkIcon"),
        useHasMounted: () => false, formatUtcDateTime: () => "", getLocalDateTimeParts: () => null,
        isPlayerReserved: () => true,
    };
    return new Function(...Object.keys(stubs), `${compiled}\nreturn {TeamComp, PersonalScheduleSection, GroupComp};`)(...Object.values(stubs));
}

const match = (id, player) => ({match_id: id, is_winner_bracket: true, datetime: null, team1: {name: `Player ${player}`, uid: [player]}, team2: null});

test("my elimination matches are separate, expanded by default, and have no explanatory text or count", async () => {
    const {TeamComp, PersonalScheduleSection} = await renderComponents(1);
    const tree = TeamComp({schedule: {stage_name: "RO16", match_info: [match("other", 2), match("mine", 1)]}, tournament_players: {players: []}});
    const section = elements(tree, node => node.type === PersonalScheduleSection)[0];
    assert(section);
    const accordion = section.props.children;
    assert.deepEqual(accordion.props.defaultExpandedKeys, ["mine:actual"]);
    assert.deepEqual(elements(accordion, node => node.type === Accordion.Item).map(node => node.props.id), ["mine:actual"]);
    assert.deepEqual(elements(tree, node => node.type === Accordion.Item).map(node => node.props.id), ["mine:actual", "other:actual"]);
    const heading = PersonalScheduleSection(section.props);
    assert.equal(elements(heading, node => node.type === "h2")[0].props.children, "我的比赛");
    assert.equal(React.Children.toArray(heading.props.children).filter(node => node.type === "p").length, 0);
    assert.equal(elements(heading, node => node.type?.displayName === "Chip").length, 0);
});

test("guests and non-participants keep the ordinary match list", async () => {
    const {TeamComp, PersonalScheduleSection} = await renderComponents(undefined);
    const tree = TeamComp({schedule: {stage_name: "RO16", match_info: [match("other", 2)]}, tournament_players: {players: []}});
    assert.equal(elements(tree, node => node.type === PersonalScheduleSection).length, 0);
});

test("multiple personal candidates can all stay expanded", async () => {
    const {TeamComp, PersonalScheduleSection} = await renderComponents(1);
    const mine = match("possible", 1);
    mine.is_possible = true;
    mine.possible_pairings = [2, 3].map(uid => ({
        team1: mine.team1.name, team1_info: mine.team1,
        team2: `Player ${uid}`, team2_info: {name: `Player ${uid}`, uid: [uid]},
    }));
    const tree = TeamComp({schedule: {stage_name: "QF", match_info: [mine]}, tournament_players: {players: []}});
    const accordion = elements(tree, node => node.type === PersonalScheduleSection)[0].props.children;
    assert.equal(accordion.props.allowsMultipleExpanded, true);
    assert.deepEqual(accordion.props.defaultExpandedKeys, ["possible:0", "possible:1"]);
});

test("qualifier lobbies keep their existing list without a personal section", async () => {
    const {GroupComp, PersonalScheduleSection} = await renderComponents(1);
    const lobby = {lobby_name: "Lobby A", match_id: "lobby", datetime: "2026-10-24T12:00:00Z", participants: [{name: "Me", uid: [1]}]};
    const tree = GroupComp({schedule: {stage_name: "资格赛", lobby_info: [lobby]}, tournamentPlayers: {players: []}});
    assert.equal(elements(tree, node => node.type === PersonalScheduleSection).length, 0);
    assert.equal(elements(tree, node => node.type === Card).length, 1);
});
