import type {TournamentPlayers} from "../app/tournaments/[tournament]/participants/page";

export function formatParticipantsForCopy({players, groups = []}: TournamentPlayers) {
    const teamNamesByUid = new Map<number, Set<string>>();
    for (const team of groups.filter((team) => team.is_verified)) {
        for (const uid of [...team.captains, ...team.members]) {
            const names = teamNamesByUid.get(uid) ?? new Set<string>();
            names.add(team.name);
            teamNamesByUid.set(uid, names);
        }
    }

    const seen = new Set<number>();
    const rows: string[] = [];
    const cell = (value: string) => value.replace(/[\t\r\n]+/g, " ");
    for (const player of players) {
        if ((!player.player && !teamNamesByUid.has(player.uid)) || seen.has(player.uid)) continue;
        seen.add(player.uid);
        const teamNames = [...(teamNamesByUid.get(player.uid) ?? [])].join(" / ");
        rows.push([String(player.uid), cell(player.name), cell(teamNames)].join("\t"));
    }

    return {text: rows.join("\n"), count: rows.length};
}
