import assert from 'node:assert/strict';
import test from 'node:test';
import {canEditMatchResult, selectedResultScores, type ResultGame} from '../lib/match-result.ts';

test('only assigned referees, hosts and schedulers see result entry', () => {
    assert.equal(canEditMatchResult(undefined, {host: true}, []), false);
    assert.equal(canEditMatchResult(1, {referee: true}, [{uid: [1]}]), true);
    assert.equal(canEditMatchResult(1, {referee: true}, [{uid: [2]}]), false);
    assert.equal(canEditMatchResult(1, {}, [{uid: [1]}]), false);
    assert.equal(canEditMatchResult(1, {host: true}, []), true);
    assert.equal(canEditMatchResult(1, {scheduler: true}, []), true);
});

test('preview score responds to selections and never counts excluded games or ties', () => {
    const game = (id: string, winner: number | null, eligible = true): ResultGame => ({id, winner, eligible, room_id: '123', beatmap_id: 1,
        scores: [10, 20], players: [1, 1], ended_at: null, reason: null, selected: true});
    const games = [game('1', 0), game('2', 1), game('3', null, false), game('4', 0, false)];
    assert.deepEqual(selectedResultScores(games, ['1', '2', '3', '4', 'missing']), [1, 1]);
    assert.deepEqual(selectedResultScores(games, ['2']), [0, 1]);
    assert.deepEqual(selectedResultScores(games, ['1', '1']), [1, 0]);
});
