const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');

const source = readFileSync(`${__dirname}/../components/schedule_comp.tsx`, 'utf8');
const compiled = ts.transpileModule(source.slice(source.indexOf('export const ScheduleComp'), source.indexOf('const PersonalScheduleSection'))
    .replace('export const', 'const'), {compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022}}).outputText;
const stages = [{stage_name: 'RO16', is_lobby: false}, {stage_name: 'QF', is_lobby: false}];

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}

function harness(query = 'stage=RO16&preview=true') {
    let search = new URLSearchParams(query);
    const states = []; let index = 0;
    const history = [];
    const stubs = {React, useSearchParams: () => search, usePathname: () => '/tournaments/Cup/schedule',
        useSWR: url => ({data: url.includes('/api/schedule?') ? stages : {state: {matches: [{id: 'M1'}]}}, mutate() {}}),
        siteConfig: {backend_url: ''}, useState: initial => {
            const position = index++;
            if (!(position in states)) states[position] = initial;
            return [states[position], value => {states[position] = value;}];
        },
        NextLink: 'a', TeamComp: 'team', GroupComp: 'group', TournamentDrawBoard: 'draw', StageNavigation: 'stages',
        window: {history: {pushState(_state, _unused, href) {
            history.push(href); search = new URL(href, 'http://localhost').searchParams;
        }}},
    };
    const ScheduleComp = new Function(...Object.keys(stubs), `${compiled}; return ScheduleComp;`)(...Object.values(stubs));
    return {history, navigate: query => {search = new URLSearchParams(query);}, render() {
        index = 0;
        return ScheduleComp({tabs: stages, tournament_name: 'Cup', tournamentPlayers: {players: []}});
    }};
}

function follow(link) {
    let prevented = false;
    assert.equal(typeof link.props.onNavigate, 'function', 'same-page view changes must bypass server navigation');
    link.props.onNavigate({preventDefault() {prevented = true;}});
    assert.equal(prevented, true);
}

test('bracket and list switch immediately through history without a server response and preserve the round', () => {
    const h = harness();
    let tree = h.render();
    follow(elements(tree, node => node.type === 'a' && node.props.children === '对阵图')[0]);
    tree = h.render();
    assert.equal(elements(tree, node => node.type === 'draw').length, 1);
    assert.equal(new URL(h.history[0], 'http://localhost').searchParams.get('stage'), 'RO16');
    assert.equal(new URL(h.history[0], 'http://localhost').searchParams.get('preview'), 'true');
    follow(elements(tree, node => node.type === 'a' && node.props.children === '赛程列表')[0]);
    tree = h.render();
    assert.equal(elements(tree, node => node.type === 'team')[0].props.schedule.stage_name, 'RO16');
    assert.equal(elements(tree, node => node.type === 'draw').length, 0);
    assert.equal(h.history.length, 2);
});

test('round links switch locally and browser history restores both round and view', () => {
    const h = harness();
    let tree = h.render();
    follow(elements(tree, node => node.type === 'a' && node.props.children.includes?.('QF'))[0]);
    tree = h.render();
    assert.equal(elements(tree, node => node.type === 'team')[0].props.schedule.stage_name, 'QF');
    h.navigate('stage=RO16&view=bracket');
    assert.equal(elements(h.render(), node => node.type === 'draw').length, 1);
    h.navigate('stage=RO16&view=list');
    assert.equal(elements(h.render(), node => node.type === 'team')[0].props.schedule.stage_name, 'RO16');
});
