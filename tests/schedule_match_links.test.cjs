const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const {pathToFileURL} = require("node:url");

// Exercise the card's actual JSX and callbacks without mounting its unrelated
// autocomplete controls or requiring a running backend.
const source = readFileSync(new URL("../app/(home)/tournament-management/[tournament]/scheduler/page.tsx", pathToFileURL(__filename)), "utf8");
const start = source.indexOf("const ScheduleCard =");
const end = source.indexOf("// --- 通用组件：单选队伍", start);
assert.ok(start >= 0 && end > start);
const compiled = ts.transpileModule(source.slice(start, end), {
    compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022},
}).outputText;
const component = name => Object.assign(() => null, {displayName: name});
const Accordion = Object.assign(component("Accordion"), Object.fromEntries(
    ["Item", "Heading", "Trigger", "Indicator", "Panel", "Body"].map(name => [name, component(name)]),
));
const Input = component("Input");
const Button = component("Button");
const FieldError = component("FieldError");
const linkValidation = {};
new Function("exports", ts.transpileModule(readFileSync(new URL("../lib/match-links.ts", pathToFileURL(__filename)), "utf8"), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText)(linkValidation);
const stubs = {
    React, Accordion, Input, Button, FieldError, getMatchUrlError: linkValidation.getMatchUrlError,
    Tooltip: Object.assign(component("Tooltip"), {Trigger: component("Trigger"), Content: component("Content")}),
    Card: component("Card"), TextField: component("TextField"), Label: component("Label"),
    Separator: component("Separator"), TrashIcon: component("TrashIcon"), MultiSelect: component("MultiSelect"),
    useHasMounted: () => false, formatUtcDateTime: () => "", utcDateTimeToLocalInput: () => "",
};
const ScheduleCard = new Function(...Object.keys(stubs), `${compiled}\nreturn ScheduleCard;`)(...Object.values(stubs));

function findElements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findElements(child, predicate)),
    ];
}

function renderLinks(matchUrls) {
    let schedule = {is_lobby: true, name: "Lobby 1", match_time: null, match_url: matchUrls};
    const render = () => ScheduleCard({schedule, staffMembers: [], participants: [], onChange: next => {schedule = next;}, onDelete() {}});
    return {
        inputs: () => findElements(render(), node => node.type === Input && node.props.placeholder?.includes("community/matches")),
        buttons: () => findElements(render(), node => node.type === Button && ["+", "-"].includes(node.props.children)),
        urls: () => schedule.match_url,
        errors: () => findElements(render(), node => node.type === FieldError).map(node => node.props.children).filter(Boolean),
    };
}

test("an empty MP link array still provides an editable first input", () => {
    const card = renderLinks([]);
    assert.equal(card.inputs().length, 1, "empty match_url must render a link input");
    const url = "https://osu.ppy.sh/community/matches/123456789";
    card.inputs()[0].props.onChange({target: {value: url}});
    assert.deepEqual(card.urls(), [url]);
    assert.equal(card.inputs()[0].props.value, url);
});

test("existing MP links can be edited, appended and removed", () => {
    const first = "https://osu.ppy.sh/community/matches/123456789";
    const second = "https://osu.ppy.sh/community/matches/987654321";
    const card = renderLinks([first]);
    card.buttons().find(node => node.props.children === "+").props.onPress();
    assert.equal(card.inputs().length, 2);
    card.inputs()[1].props.onChange({target: {value: second}});
    assert.deepEqual(card.urls(), [first, second]);
    card.buttons().find(node => node.props.children === "-").props.onPress();
    assert.deepEqual(card.urls(), [second]);
    card.inputs()[0].props.onChange({target: {value: ""}});
    assert.deepEqual(card.urls(), [""]);
    assert.equal(card.inputs().length, 1);
});

test("adding a row to an empty MP link list keeps both editable rows", () => {
    const card = renderLinks([]);
    card.buttons().find(node => node.props.children === "+").props.onPress();
    assert.deepEqual(card.urls(), ["", ""]);
    assert.equal(card.inputs().length, 2);
});

test("missing and blank MP link lists also provide the initial input", () => {
    for (const urls of [undefined, null, [""]]) {
        const card = renderLinks(urls);
        assert.equal(card.inputs().length, 1);
        assert.equal(card.inputs()[0].props.value, "");
    }
});

test("beatmap links display an inline error that clears when corrected to an MP link", () => {
    const card = renderLinks(["https://osu.ppy.sh/b/4692822"]);
    assert.match(card.errors()[0], /MP 房间链接/);
    card.inputs()[0].props.onChange({target: {value: "https://osu.ppy.sh/community/matches/123"}});
    assert.deepEqual(card.errors(), []);
});
