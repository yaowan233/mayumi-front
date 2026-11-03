const assert = require('node:assert/strict');
const test = require('node:test');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const React = require('react');
const source = readFileSync(`${__dirname}/../components/stats_comp.tsx`, 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
}}).outputText;
const component = () => () => null;
const compound = names => Object.assign(component(), Object.fromEntries(names.map(name => [name, component()])));
const Card = compound(['Header', 'Content']);
const Tabs = compound(['ListContainer', 'List', 'Tab', 'Indicator', 'Panel']);
const Avatar = compound(['Image', 'Fallback']);
const Button = component();
const RatingFormula = component();
const round = {tournament_name: 'Cup', stage_name: 'RO16', is_lobby: false};
const map = {map_id: '1', map_set_id: '10', map_name: 'Song', mod: 'NM', index: 0};
const stage = [{stage_name: 'RO16', mod_bracket: [{mod: 'NM', maps: [map]}]}];
const players = [{uid: 1, name: 'Alice'}, {uid: 2, name: 'Bob'}];
const teams = [{name: 'Team A', captains: [1], members: [2], is_verified: true}];
const scores = [1, 2].map((uid, i) => ({tournament_name: 'Cup', stage_name: 'RO16', map_id: 1, player: String(uid),
    start_time: '2026-11-03T06:00:00Z', score: 100 - i * 20, acc: .99, mod: ['NF']}));
const ratingContext = {links: scores.map(score => ({...score, match_id: 'match', game_id: 'game'})),
    matches: [{match_id: 'match', mean_maps_played: 1}]};

function elements(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}
function content(node) {
    if (!React.isValidElement(node)) return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
    return React.Children.toArray(node.props.children).map(content).join('');
}
async function harness({qualifierLeaderboard = []} = {}) {
    const statistics = await import('../lib/statistics-scores.ts');
    const {getStatisticsRoundSelection} = await import('../lib/statistics-rounds.ts');
    const values = []; let index = 0;
    const requests = [];
    const searchParams = new URLSearchParams();
    const mocks = {
        react: {useMemo: fn => fn(), useTransition: () => [false, fn => fn()], useState(initial) {
            const position = index++;
            if (!(position in values)) values[position] = initial;
            return [values[position], update => {values[position] = update;}];
        }},
        'react/jsx-runtime': require('react/jsx-runtime'),
        '@heroui/react': {Card, Tabs, Avatar, Button, Chip: component(), Spinner: component()},
        'next/navigation': {useSearchParams: () => searchParams, useRouter: () => ({replace(query) {
            for (const key of [...searchParams.keys()]) searchParams.delete(key);
            for (const [key, value] of new URLSearchParams(query.slice(1))) searchParams.set(key, value);
        }})},
        '@/lib/statistics-rounds': {getStatisticsRoundSelection},
        '@/lib/statistics-scores': statistics,
        '@/lib/leaderboard-response': await import('../lib/leaderboard-response.ts'),
        '@/lib/datetime': {formatLocalDateTime: value => value},
        '@/config/site': {siteConfig: {backend_url: ''}},
        '@/lib/tournament_draw': {requestDraw: () => {throw new Error('Unexpected request');}},
        '@/components/rating_formula': {RatingFormula},
        swr: key => {
            if (key) requests.push(key);
            return key?.includes('/cal_rank?') ? {data: qualifierLeaderboard} : {};
        },
    };
    const exports = {};
    new Function('require', 'exports', `${compiled}\nObject.assign(exports, {MapScoresGrid, SingleMapCard, TeamMapScores, LeaderboardPanel});`)(
        name => {if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`); return mocks[name];}, exports);
    return {...exports, requests, searchParams, render: (fn, props) => {index = 0; return fn(props);}};
}

test('statistics shows only the selected section and has a separate personal Rating tab', async () => {
    const h = await harness();
    const props = {roundInfo: [round], stats: [], stage, scores, players, teams, ratingContext, isTeamTournament: true};
    let tree = h.render(h.StatsComp, props);
    assert.doesNotMatch(content(tree), /队伍排行榜/);
    assert.equal(elements(tree, node => node.type === h.LeaderboardPanel).length, 0);
    const grid = elements(tree, node => node.type === h.MapScoresGrid)[0];
    assert.equal(grid.props.isTeamRound, true);
    assert.deepEqual(grid.props.teams, teams);
    const sections = elements(tree, node => node.type === Tabs && node.props.selectedKey === 'maps')[0];
    sections.props.onSelectionChange('rating');
    tree = h.render(h.StatsComp, props);
    assert.match(content(tree), /个人 Rating 排名/);
    const explanation = elements(tree, node => node.type === 'details').find(node => content(node).includes('Rating 计算公式'));
    assert.ok(explanation);
    assert.notEqual(explanation.props.open, true);
    assert.match(content(explanation), /中位数基准/);
    assert.equal(elements(explanation, node => node.type === RatingFormula).length, 1);
    assert.equal(elements(tree, node => node.type === h.MapScoresGrid).length, 0);
    const leaderboard = elements(tree, node => node.type === h.LeaderboardPanel)[0];
    assert.deepEqual(leaderboard.props.leaderboard.map(row => [row.name, row.Rating]), [['Alice', 100 / 90], ['Bob', 80 / 90]]);
    assert.deepEqual(leaderboard.props.leaderboard.map(row => row['出场局数']), [1, 1]);
    assert.equal(h.requests.some(url => url.includes('/cal_rank?')), false);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rating')[0].props.onSelectionChange('rankings');
    tree = h.render(h.StatsComp, props);
    assert.match(content(tree), /个人排名明细/);
    assert.equal(elements(tree, node => node.type === h.LeaderboardPanel)[0].props.fullDetails, true);
});

test('team qualifiers retain the original team leaderboard as the default view', async () => {
    const qualifierLeaderboard = [{name: 'Team A', Rating: 2.5, '平均排名': 1, '平均分数': 180, 'NM 1': 1, 'NM 1 成绩': 180}];
    const h = await harness({qualifierLeaderboard});
    const props = {roundInfo: [{...round, is_lobby: true}], stats: [], stage, scores, players, teams, ratingContext, preview: true, isTeamTournament: true};
    let tree = h.render(h.StatsComp, props);
    assert.match(content(tree), /资格赛队伍排名/);
    assert.ok(elements(tree, node => node.type === Tabs.Tab && node.props.id === 'rankings').length);
    assert.equal(elements(tree, node => node.type === h.MapScoresGrid).length, 0);
    const board = elements(tree, node => node.type === h.LeaderboardPanel)[0];
    assert.deepEqual(board.props.leaderboard, qualifierLeaderboard);
    assert.equal(board.props.isTeamLeaderboard, true);
    assert.equal(board.props.fullDetails, true);
    const query = new URL(h.requests[0], 'https://example.com').searchParams;
    assert.equal(query.get('tournament_name'), 'Cup');
    assert.equal(query.get('stage_name'), 'RO16');
    assert.equal(query.get('preview'), 'true');
    const tableHarness = await harness();
    const table = tableHarness.render(tableHarness.LeaderboardPanel, board.props);
    assert.match(content(table), /1 支队伍/);
    assert.ok(elements(table, node => node.type === 'th' && content(node).includes('队伍')).length);
    // Use a fresh harness so child-component hook state does not overlap the page.
    const page = await harness({qualifierLeaderboard});
    tree = page.render(page.StatsComp, props);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rankings')[0].props.onSelectionChange('rating');
    tree = page.render(page.StatsComp, props);
    assert.match(content(tree), /个人 Rating 排名/);
    assert.notEqual(elements(tree, node => node.type === page.LeaderboardPanel)[0].props.isTeamLeaderboard, true);
});

test('switching from qualifier rankings to an elimination round shows individual details without the qualifier API', async () => {
    const h = await harness();
    const props = {roundInfo: [{...round, is_lobby: true}], stats: [], stage, scores, players, teams, ratingContext, isTeamTournament: true};
    let tree = h.render(h.StatsComp, props);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rankings')[0].props.onSelectionChange('rankings');
    const requestsBefore = h.requests.length;
    tree = h.render(h.StatsComp, {...props, roundInfo: [round]});
    assert.match(content(tree), /个人排名明细/);
    assert.equal(h.requests.length, requestsBefore);
    const board = elements(tree, node => node.type === h.LeaderboardPanel)[0];
    assert.equal(board.props.isTeamLeaderboard, false);
    assert.equal(board.props.fullDetails, true);
});

test('entering or returning to a qualifier prioritizes its standalone standings over another rounds selected tab', async () => {
    const h = await harness();
    const qualifier = {...round, stage_name: 'Qualifiers', is_lobby: true};
    const props = {roundInfo: [qualifier, round], stats: [], stage, scores: [...scores, ...scores.map(score => ({...score, stage_name: 'Qualifiers'}))],
        players, teams, ratingContext, isTeamTournament: true};
    h.searchParams.set('stage', 'RO16');
    let tree = h.render(h.StatsComp, props);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'maps')[0].props.onSelectionChange('rating');
    tree = h.render(h.StatsComp, props);
    assert.match(content(tree), /个人 Rating 排名/);
    // External stage navigation also must not carry the previous round's view.
    h.searchParams.set('stage', 'Qualifiers');
    tree = h.render(h.StatsComp, props);
    assert.equal(elements(tree, node => node.type === h.MapScoresGrid).length, 0);
    let sections = elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rankings')[0];
    assert.ok(sections);
    assert.equal(elements(sections, node => node.type === Tabs.Tab)[0].props.id, 'rankings');
    assert.equal(elements(tree, node => node.type === h.LeaderboardPanel)[0].props.isTeamLeaderboard, true);
    sections.props.onSelectionChange('maps');
    tree = h.render(h.StatsComp, props);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'Qualifiers')[0].props.onSelectionChange('RO16');
    tree = h.render(h.StatsComp, props);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'RO16')[0].props.onSelectionChange('Qualifiers');
    tree = h.render(h.StatsComp, props);
    sections = elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rankings')[0];
    assert.ok(sections, 'returning to the qualifier must reset its selected view to standings');
});

test('qualifier standings always show every map rank and score and support per-map sorting', async () => {
    const h = await harness();
    const props = {isTeamLeaderboard: true, leaderboard: [
        {name: 'Team A', Rating: 2.5, '平均排名': 1.5, '平均分数': 190, 'NM 1': 2, 'NM 1 成绩': 180, 'HD 1': 1, 'HD 1 成绩': 200},
        {name: 'Team B', Rating: 2, '平均排名': 1.5, '平均分数': 190, 'NM 1': 1, 'NM 1 成绩': 200, 'HD 1': 2, 'HD 1 成绩': 180},
    ]};
    let tree = h.render(h.LeaderboardPanel, props);
    const headings = elements(tree, node => node.type === 'th').map(content);
    for (const name of ['NM 1', 'NM 1 成绩', 'HD 1', 'HD 1 成绩']) assert.ok(headings.includes(name), `missing qualifier column: ${name}`);
    assert.equal(elements(tree, node => node.type === Button).length, 0);
    elements(tree, node => node.type === 'th' && content(node) === 'NM 1')[0].props.onClick();
    tree = h.render(h.LeaderboardPanel, props);
    assert.match(content(elements(tree, node => node.type === 'tbody')[0].props.children[0]), /Team B/);
    elements(tree, node => node.type === 'th' && content(node) === 'HD 1 成绩')[0].props.onClick();
    tree = h.render(h.LeaderboardPanel, props);
    assert.match(content(elements(tree, node => node.type === 'tbody')[0].props.children[0]), /Team A/);
});

test('map ranking defaults to team totals and switches to individual scores', async () => {
    const h = await harness();
    const props = {stage, round, scores, players, teams, isTeamRound: true};
    let tree = h.render(h.MapScoresGrid, props);
    assert.equal(elements(tree, node => node.type === h.SingleMapCard)[0].props.showTeams, true);
    const tabs = elements(tree, node => node.type === Tabs)[0];
    assert.equal(tabs.props.selectedKey, 'team');
    tabs.props.onSelectionChange('player');
    tree = h.render(h.MapScoresGrid, props);
    assert.equal(elements(tree, node => node.type === h.SingleMapCard)[0].props.showTeams, false);
});

test('solo qualifiers retain their original standings independently from personal Rating and team scores', async () => {
    const qualifierLeaderboard = [{name: 'Alice', Rating: 2, 'NM 1': 1, 'NM 1 成绩': 100}];
    const h = await harness({qualifierLeaderboard});
    const props = {roundInfo: [{...round, is_lobby: true, is_solo_qualifier: true}], stats: [], stage, scores, players, teams, isTeamTournament: true};
    let tree = h.render(h.StatsComp, props);
    assert.match(content(tree), /资格赛排名/);
    const board = elements(tree, node => node.type === h.LeaderboardPanel)[0];
    assert.deepEqual(board.props.leaderboard, qualifierLeaderboard);
    assert.equal(board.props.isTeamLeaderboard, false);
    assert.equal(board.props.fullDetails, true);
    elements(tree, node => node.type === Tabs && node.props.selectedKey === 'rankings')[0].props.onSelectionChange('maps');
    tree = h.render(h.StatsComp, props);
    const grid = elements(tree, node => node.type === h.MapScoresGrid)[0];
    assert.equal(grid.props.isTeamRound, false);
    const gridTree = h.render(h.MapScoresGrid, grid.props);
    assert.equal(elements(gridTree, node => node.type === Tabs).length, 0);
    assert.equal(elements(gridTree, node => node.type === h.SingleMapCard)[0].props.showTeams, false);
});

test('map cards aggregate numeric API map IDs and expose the actual contributing members', async () => {
    const h = await harness();
    const tree = h.render(h.SingleMapCard, {map, roundName: 'RO16', scores, players, teams, showTeams: true});
    const list = elements(tree, node => node.type === h.TeamMapScores)[0];
    assert.equal(list.props.scores[0].score, 180);
    const listTree = h.TeamMapScores(list.props);
    assert.match(content(listTree), /合计分数/);
    assert.match(content(listTree), /Team A/);
    assert.match(content(listTree), /2 名成员/);
    assert.match(content(listTree), /Alice/);
    assert.match(content(listTree), /Bob/);
    assert.equal(elements(listTree, node => node.type === 'details').length, 1);
});

test('all maps remain visible in both team and individual score views', async () => {
    const h = await harness();
    const props = {stage: [{stage_name: 'RO16', mod_bracket: [{mod: 'NM', maps: [map, {...map, map_id: '2', map_name: 'Second song'}]}]}],
        round, scores, players, teams, isTeamRound: true};
    let tree = h.render(h.MapScoresGrid, props);
    const cards = node => elements(node, element => element.type === h.SingleMapCard);
    assert.deepEqual(cards(tree).map(card => card.props.map.map_id), ['1', '2']);
    assert.ok(cards(tree).every(card => card.props.showTeams));
    elements(tree, node => node.type === Tabs)[0].props.onSelectionChange('player');
    tree = h.render(h.MapScoresGrid, props);
    assert.deepEqual(cards(tree).map(card => card.props.map.map_id), ['1', '2']);
    assert.ok(cards(tree).every(card => !card.props.showTeams));
});

test('personal Rating summary and the separate details view have distinct columns without an inline toggle', async () => {
    const h = await harness();
    const props = {leaderboard: [{name: 'Alice', Rating: 1, '出场局数': 2, '平均排名': 1, '平均分数': 100, 'NM 1': 1, 'NM 1 平均成绩': 100}]};
    let tree = h.render(h.LeaderboardPanel, props);
    assert.equal(elements(tree, node => node.type === 'th').length, 6);
    assert.match(content(tree), /出场局数/);
    assert.equal(elements(tree, node => node.type === Button).length, 0);
    tree = h.render(h.LeaderboardPanel, {...props, fullDetails: true});
    assert.equal(elements(tree, node => node.type === 'th').length, 8);
    assert.equal(elements(tree, node => node.type === Button).length, 0);
});

test('personal Rating table sorts by Rating descending with full precision', async () => {
    const h = await harness();
    const tree = h.render(h.LeaderboardPanel, {leaderboard: [
        {name: 'Lower', Rating: .999999}, {name: 'Higher', Rating: 1},
    ]});
    const rows = elements(tree, node => node.type === 'tr').slice(1);
    assert.match(content(rows[0]), /Higher/);
    assert.match(content(rows[1]), /Lower/);
    assert.equal(elements(rows[1], node => node.type === 'span' && node.props.title === '0.999999').length, 1);
});

test('provisional and unassociated results stay outside the official numbered ranking', async () => {
    const h = await harness();
    const tree = h.render(h.LeaderboardPanel, {leaderboard: [
        {name: 'Small sample', Rating: 3, '状态': '暂定'},
        {name: 'Official', Rating: 1, '状态': '正式'},
        {name: 'Unassociated', Rating: '-', '状态': '待关联'},
    ]});
    const rows = elements(tree, node => node.type === 'tr').slice(1);
    assert.match(content(rows[0]), /Official/);
    assert.equal(content(elements(rows[0], node => node.type === 'td')[0]), '1');
    for (const row of rows.slice(1)) assert.equal(content(elements(row, node => node.type === 'td')[0]), '-');
});
