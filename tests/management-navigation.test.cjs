const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const source = readFileSync(`${__dirname}/../app/(home)/tournament-management/page.tsx`, 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
const Link = () => null;
const Card = Object.assign(() => null, {Header() {}, Content() {}, Footer() {}});
function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}
function render(tournaments) {
    let state = 0;
    const mocks = {react: {...React, useContext: () => ({currentUser: {uid: 77}}), useEffect() {},
        useState: () => [state++ === 0 ? tournaments : false, () => {}]},
        'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': {__esModule: true, default: Link},
        '@heroui/react': {Card, Button() {}, Chip() {}, Tooltip() {}, buttonVariants: () => 'button'},
        '@/components/page_skeleton': {ManagementListSkeleton() {}}, '@/app/user_context': {default: {}},
        '@/lib/tournament_management': {},
    };
    const exports = {};
    new Function('require', 'exports', compiled)(name => mocks[name], exports);
    return exports.default();
}

test('management cards and both create entrances use client-side links instead of reloading the document', () => {
    const tree = render([{tournament_name: 'Cup', abbreviation: 'Cup 中文', roles: ['主办'], status: 'draft'}]);
    const links = elements(tree, node => node.type === Link);
    const card = links.find(node => node.props.href === '/tournament-management/Cup%20%E4%B8%AD%E6%96%87');
    assert.ok(card, 'management card must have a native Next Link with the encoded tournament URL');
    assert.equal(elements(card, node => node.type === Card).length, 1);
    assert.ok(links.some(node => node.props.href === '/create-tournament'));
    assert.equal(elements(render([]), node => node.type === Link && node.props.href === '/create-tournament').length, 2);
});
