const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const source = readFileSync(`${__dirname}/../components/schedule_comp.tsx`, 'utf8');
const compiled = ts.transpileModule(source.slice(source.indexOf('export const ScheduleComp'), source.indexOf('const PersonalScheduleSection')).replace('export const', 'const'), {compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022}}).outputText;
function render(tabs, data) {
    const stubs = {React, useSearchParams: () => new URLSearchParams(), usePathname: () => '/schedule',
        useSWR: url => ({data: url.includes('/api/schedule?') ? data : null, mutate: () => {}}),
        siteConfig: {backend_url: ''}, useState: value => [value, () => {}],
        NextLink: 'a', TeamComp: 'team', GroupComp: 'group', TournamentDrawBoard: 'draw'};
    return new Function(...Object.keys(stubs), `${compiled}; return ScheduleComp;`)(...Object.values(stubs))({tabs, tournament_name: 'test', tournamentPlayers: {players: []}});
}
function stages(tree) {
    if (!React.isValidElement(tree)) return [];
    return [...(tree.type === 'team' ? [tree.props.schedule.stage_name] : []), ...React.Children.toArray(tree.props.children).flatMap(stages)];
}
test('null SWR response retains initial schedule', () => assert.deepEqual(stages(render([{stage_name: 'QF'}], null)), ['QF']));
test('null initial and refreshed schedule render an empty schedule', () => assert.deepEqual(stages(render(null, null)), []));
test('empty refreshed schedule replaces previous stages', () => assert.deepEqual(stages(render([{stage_name: 'QF'}], [])), []));
test('refreshed stages render normally', () => assert.deepEqual(stages(render([], [{stage_name: 'Final'}])), ['Final']));
