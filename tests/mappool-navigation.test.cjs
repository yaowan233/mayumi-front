const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const source = readFileSync(`${__dirname}/../components/mappools.tsx`, 'utf8');
const start = source.indexOf('export const MappoolsComponents');
const compiled = ts.transpileModule(source.slice(start, source.indexOf('const MapComponent =', start)).replace('export const', 'const'),
    {compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022}}).outputText;

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}
test('mappool rounds use loaded maps, preserve query parameters and follow browser history without server navigation', () => {
    let search = new URLSearchParams('stage=QF&preview=true');
    const serverNavigations = [], history = [];
    const values = []; let index = 0;
    const stubs = {React, useSearchParams: () => search, useRouter: () => ({replace(href) {serverNavigations.push(href);}}),
        useParams: () => ({tournament: 'Cup'}), useMemo: fn => fn(), useState(initial) {
            const position = index++;
            if (!(position in values)) values[position] = initial;
            return [values[position], value => {values[position] = value;}];
        }, StageNavigation: 'stages', CopyMappoolButton: 'copy', DownloadMenu: 'download', getModColor: () => ({hex: '#0088ff'}),
        window: {history: {pushState(_state, _unused, href) {history.push(href); search = new URL(href, 'http://localhost').searchParams;}}},
    };
    const Mappools = new Function(...Object.keys(stubs), `${compiled}; return MappoolsComponents;`)(...Object.values(stubs));
    const tabs = ['RO16', 'QF'].map(stage_name => ({stage_name, mod_bracket: []}));
    const render = () => {index = 0; return Mappools({tabs});};
    let tree = render();
    elements(tree, node => node.type === 'button' && node.props.children.includes?.('RO16'))[0].props.onClick();
    tree = render();
    assert.equal(elements(tree, node => node.type === 'copy')[0].props.stage.stage_name, 'RO16');
    assert.deepEqual(serverNavigations, [], 'round selection must not request another server render');
    assert.equal(history.length, 1);
    assert.equal(search.get('preview'), 'true');
    assert.equal(search.get('stage'), 'RO16');
    search = new URLSearchParams('stage=QF&preview=true');
    assert.equal(elements(render(), node => node.type === 'copy')[0].props.stage.stage_name, 'QF');
});
