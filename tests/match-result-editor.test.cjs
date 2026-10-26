const assert = require('node:assert/strict');
const test = require('node:test');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const React = require('react');
const source = readFileSync(`${__dirname}/../components/match_result_editor.tsx`, 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022}}).outputText;
function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}
function content(node) {
    if (!React.isValidElement(node)) return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
    return React.Children.toArray(node.props.children).map(content).join('');
}
async function harness(failSave = false) {
    const {selectedResultScores} = await import('../lib/match-result.ts');
    const {normalizeMatchUrls} = await import('../lib/match-links.ts');
    const Button = () => null, TextArea = () => null;
    const values = [], requests = []; let index = 0, refreshes = 0;
    const details = {version: 'v1', match_urls: [], teams: ['A', 'B'], scores: [0, 0], can_calculate: true, best_of: null};
    const mocks = {
        react: {useState(initial) { const position = index++; if (!(position in values)) values[position] = initial;
            return [values[position], update => {values[position] = typeof update === 'function' ? update(values[position]) : update;}]; }},
        'react/jsx-runtime': require('react/jsx-runtime'), '@heroui/react': {Button, TextArea},
        '@/config/site': {siteConfig: {backend_url: ''}}, '@/lib/match-links': {normalizeMatchUrls},
        '@/lib/match-result': {selectedResultScores},
        '@/lib/tournament_draw': {requestDraw: async (url, body) => {
            requests.push({url, body});
            if (!body) return details;
            if (url.includes('/preview?')) return {...details, version: 'preview-v2', preview_version: 'mp-v1', games: [0, 1].map((winner, i) => ({id: String(i), room_id: '123', beatmap_id: 10 + i,
                scores: [100, 200], players: [1, 1], winner, selected: true, eligible: true, ended_at: null}))};
            if (failSave) throw new Error('赛程已被修改，请重新加载');
            return {ok: true};
        }},
    };
    const exports = {};
    new Function('require', 'exports', compiled)(name => {if (!(name in mocks)) throw new Error(name); return mocks[name];}, exports);
    const render = () => {index = 0; return exports.MatchResultEditor({tournament: 'Cup', stage: 'SF', matchId: 'match', onSaved: async () => {refreshes++;}});};
    const button = (tree, label) => elements(tree, node => node.type === Button && content(node).includes(label))[0];
    return {render, button, requests, TextArea, refreshes: () => refreshes};
}

test('referee can load, preview, exclude a replay, and confirm recomputed score', async () => {
    const h = await harness();
    await h.button(h.render(), '录入 MP').props.onPress();
    elements(h.render(), node => node.type === h.TextArea)[0].props.onChange({target: {value: 'https://osu.ppy.sh/mp/123'}});
    await h.button(h.render(), '预览计算比分').props.onPress();
    const checkboxes = elements(h.render(), node => node.type === 'input');
    checkboxes[0].props.onChange({target: {checked: false}});
    await h.button(h.render(), '确认保存比分').props.onPress();
    assert.deepEqual(h.requests.at(-1).body, {version: 'preview-v2', match_urls: ['https://osu.ppy.sh/mp/123'], selected_game_ids: ['1'], expected_scores: [0, 1], preview_version: 'mp-v1'});
    assert.equal(h.refreshes(), 1);
    assert.match(content(h.render()), /MP 链接和比分已保存/);
});

test('editing a link invalidates the old preview and save failures stay visible', async () => {
    const h = await harness(true);
    await h.button(h.render(), '录入 MP').props.onPress();
    const input = value => elements(h.render(), node => node.type === h.TextArea)[0].props.onChange({target: {value}});
    input('https://osu.ppy.sh/mp/123');
    await h.button(h.render(), '预览计算比分').props.onPress();
    input('https://osu.ppy.sh/mp/456');
    assert.equal(h.button(h.render(), '确认保存比分'), undefined);
    await h.button(h.render(), '仅保存链接').props.onPress();
    assert.deepEqual(h.requests.at(-1).body, {version: 'preview-v2', match_urls: ['https://osu.ppy.sh/mp/456']});
    assert.equal(h.refreshes(), 0);
    assert.match(content(elements(h.render(), node => node.props.role === 'alert')[0]), /赛程已被修改/);
});
