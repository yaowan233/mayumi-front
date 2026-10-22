const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");

const source = readFileSync(`${__dirname}/../components/mappools.tsx`, "utf8");
const start = source.indexOf("const MapComponent =");
const compiled = ts.transpileModule(source.slice(start, source.indexOf("export interface Stage", start)), {
    compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022},
}).outputText;
const IconButton = () => null;
const stubs = {
    React, useState: () => [false, () => {}], getModColor: () => ({hex: "#006FEE"}),
    IconButton, CopyIcon: () => null, DownloadIcon: () => null,
};
const MapComponent = new Function(...Object.keys(stubs), `${compiled}\nreturn MapComponent;`)(...Object.values(stubs));

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}
function text(node) {
    if (!React.isValidElement(node)) return typeof node === "string" || typeof node === "number" ? String(node) : "";
    return React.Children.toArray(node.props.children).map(text).join("");
}

test("map labels keep the submitted number when earlier slots are absent", () => {
    const tree = MapComponent({map: {map_id: 102, number: 3, map_set_id: 1020, star_rating: 5}, index: 0, mod: "RC"});
    assert.match(text(tree), /RC3/);
    assert.doesNotMatch(text(tree), /RC1/);
    assert.equal(elements(tree, node => node.type === "img").length, 1);
});

test("pending metadata shows a visible slot and official beatmap link without fabricated stats or broken cover", () => {
    const tree = MapComponent({map: {map_id: 101, number: 1, map_set_id: -1, metadata_pending: true, map_name: "Beatmap 101"}, index: 0, mod: "RC"});
    assert.match(text(tree), /RC1/);
    assert.match(text(tree), /Beatmap 101/);
    assert.match(text(tree), /谱面信息待同步/);
    assert.doesNotMatch(text(tree), /★|CS |AR |OD |HP /);
    assert.equal(elements(tree, node => node.type === "img").length, 0);
    assert.equal(elements(tree, node => node.type === IconButton && node.props.label === "查看官网谱面")[0].props.href, "https://osu.ppy.sh/b/101");
});

test("older responses without an explicit number retain sequential labels", () => {
    assert.match(text(MapComponent({map: {map_id: 101}, index: 1, mod: "NM"})), /NM2/);
});

test("batch download reports pending maps instead of silently exporting an incomplete pool", async () => {
    const start = source.indexOf("    const handleDownloadAll =");
    const body = source.slice(start, source.indexOf("\n    return (", start));
    const js = ts.transpileModule(body, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
    const alerts = [];
    const download = new Function("alert", `${js}\nreturn handleDownloadAll;`)(message => alerts.push(message));
    await download({mod_bracket: [{mod: "RC", maps: [{map_id: 101, metadata_pending: true}]}]}, "osu-direct");
    assert.deepEqual(alerts, ["部分谱面信息待同步，请稍后刷新后再下载图池。"]);
});

test("partial mirror failures save successful maps and clearly report missing maps", async () => {
    const start = source.indexOf("    const handleDownloadAll =");
    const body = source.slice(start, source.indexOf("\n    return (", start));
    const js = ts.transpileModule(body, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
    const alerts = [], calls = [], saved = [], entries = [], states = [];
    class Zip {
        file(name, data) { entries.push({name, data}); }
        async generateAsync() { return new Blob(['pack']); }
    }
    const deps = {
        alert: message => alerts.push(message), JSZip: Zip, tournamentAbbr: 'Cup',
        sanitizeFilename: value => value, delay: async () => {},
        saveAs: (data, name) => saved.push(name),
        setDownloadState: update => { states.push(typeof update === 'function' ? update({}) : update); },
        downloadBeatmapset: async (id, options) => {
            calls.push({id, preferred: options.preferred});
            if (id === '2') throw new Error('所有镜像均下载失败');
            return new ArrayBuffer(4);
        },
    };
    const download = new Function(...Object.keys(deps), `${js}\nreturn handleDownloadAll;`)(...Object.values(deps));
    await download({stage_name: 'QF', mod_bracket: [{mod: 'NM', maps: [
        {map_id: 11, map_set_id: 1, map_name: 'First'},
        {map_id: 12, map_set_id: 1, map_name: 'Duplicate set'},
        {map_id: 21, map_set_id: 2, map_name: 'Missing'},
    ]}]}, 'auto');
    assert.deepEqual(calls, [{id: '1', preferred: 'auto'}, {id: '2', preferred: 'auto'}]);
    assert.equal(saved.length, 1);
    assert.equal(entries.filter(entry => entry.name.endsWith('.osz')).length, 1);
    assert.equal(entries.filter(entry => entry.name.startsWith('ERROR_')).length, 1);
    assert.match(entries.find(entry => entry.name.startsWith('ERROR_')).data, /https:\/\/osu.ppy.sh\/beatmapsets\/2\/download/);
    assert.match(alerts[0], /图池下载不完整：1\/2/);
    assert.equal(states.some(state => state.text === '下载完成！'), false);
});
