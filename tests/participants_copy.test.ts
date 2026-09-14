import assert from "node:assert/strict";
import test from "node:test";
import type {Player, Team} from "../app/tournaments/[tournament]/participants/page";
import {formatParticipantsForCopy} from "../lib/participants_copy.ts";

const player = (uid: number, name: string, overrides: Partial<Player> = {}): Player => ({
    uid, name, player: true, tournament_name: "Cup", pp: 0, rank: 0, country: "CN", ...overrides,
});
const team = (overrides: Partial<Team> = {}): Team => ({
    tournament_name: "Cup", name: "Team A", captains: [1], members: [2], is_verified: true, ...overrides,
});

test("copies captains, members and solo entrants once, excluding staff without a playing role", () => {
    const result = formatParticipantsForCopy({
        players: [player(1, "Captain", {player: false}), player(2, "Member"), player(3, "Solo"), player(4, "Staff", {player: false, referee: true}), player(2, "Member")],
        groups: [team()],
    });
    assert.deepEqual(result, {text: "1\tCaptain\tTeam A\n2\tMember\tTeam A\n3\tSolo\t", count: 3});
});

test("does not copy unverified team names or include their non-player members", () => {
    const result = formatParticipantsForCopy({
        players: [player(1, "Solo", {group: "Hidden team"}), player(2, "Staff", {player: false})],
        groups: [team({name: "Hidden team", is_verified: false})],
    });
    assert.deepEqual(result, {text: "1\tSolo\t", count: 1});
});

test("preserves three columns and one row per player even when names contain separators", () => {
    assert.deepEqual(formatParticipantsForCopy({players: []}), {text: "", count: 0});
    const result = formatParticipantsForCopy({
        players: [player(1, "A\tB\r\nC")],
        groups: [team({name: "Team\nA", members: [1]}), team({name: "Team B"})],
    });
    assert.deepEqual(result, {text: "1\tA B C\tTeam A / Team B", count: 1});
});
