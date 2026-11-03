import {notFound} from "next/navigation";
import {StatsComp} from "@/components/stats_comp";
import type {Stage} from "@/components/mappools";
import type {Player, Team} from "@/app/tournaments/[tournament]/participants/page";
import type {StatisticsScore, RatingMatchContext} from "@/lib/statistics-scores";

export default function StatsPreviewPage() {
    if (process.env.NODE_ENV !== "development") notFound();
    const tournament = "统计界面演示";
    const rounds = ["RO16", "四分之一决赛"].map(stage_name => ({tournament_name: tournament, stage_name, is_lobby: false}));
    const names = ["星屿", "晴空", "月光", "远航", "极光", "白昼", "流星", "晚风"];
    const players: Player[] = names.map((name, index) => ({
        uid: index + 1, name, tournament_name: tournament, pp: 10000, rank: 1000, country: "CN", player: true,
    }));
    const teams: Team[] = ["星河队", "晴空队", "极光队", "晚风队"].map((name, index) => ({
        tournament_name: tournament, name, captains: [index * 2 + 1], members: [index * 2 + 2], is_verified: true,
    }));
    const stage: Stage[] = rounds.map(round => ({
        stage_name: round.stage_name,
        mod_bracket: ["NM", "HD", "HR", "DT", "FM", "TB"].map((mod, index) => ({mod, maps: [{
            map_id: String(100001 + index), map_set_id: "41823", map_name: `演示谱面 ${index + 1}`,
            mapper: "Demo Mapper", star_rating: (5.5 + index * .2).toFixed(2), ar: "9", od: "8", cs: "4", hp: "6",
            bpm: "180", length: "180", drain_time: "170", number: 1, diff_name: "Tournament Difficulty",
        }]})),
    }));
    const scores: StatisticsScore[] = rounds.flatMap((round, roundIndex) => stage[roundIndex].mod_bracket.flatMap((bracket, mapIndex) =>
        [0, 1].flatMap(play => players.map((player, index) => ({
            tournament_name: tournament, stage_name: round.stage_name, map_id: bracket.maps[0].map_id,
            player: String(player.uid), start_time: `2026-11-0${roundIndex + 1}T0${play + 6}:0${mapIndex}:00Z`,
            score: 650000 + ((index * 47321 + mapIndex * 33193 + play * 79627 + roundIndex * 17437) % 340000),
            acc: .94 + ((index + mapIndex + play) % 6) * .01, mod: ["NF", ...(bracket.mod === "NM" ? [] : [bracket.mod])],
        }))),
    ));
    const stats = rounds.flatMap(round => ["NM", "HD", "HR", "DT", "FM", "TB"].map(mod => ({
        stage_name: round.stage_name, mod_name: `${mod} 1`, score_max: 987000, score_min: 650000,
        score_avg: 818500, acc_max: .99, acc_min: .94, acc_avg: .965, miss_max: 12, miss_min: 0, miss_avg: 4.5,
    })));
    const ratingContext: RatingMatchContext = {
        links: scores.map(score => ({player: score.player, map_id: score.map_id, start_time: score.start_time,
            match_id: `${score.stage_name}:${score.start_time.slice(11, 13)}:${Math.floor((Number(score.player) - 1) / 4)}`,
            game_id: `${score.stage_name}:${score.start_time}:${score.map_id}`})),
        matches: rounds.flatMap(round => [6, 7].flatMap(hour => [0, 1].map(pair => ({
            match_id: `${round.stage_name}:0${hour}:${pair}`, mean_maps_played: 6,
        })))),
    };
    return <div className="mx-auto max-w-7xl py-8">
        <div className="mb-6 px-4">
            <p className="mb-2 text-sm font-medium text-primary">本地预览 · 演示数据</p>
            <h1 className="text-2xl font-bold">比赛数据统计</h1>
        </div>
        <StatsComp roundInfo={rounds} stats={stats} stage={stage} scores={scores} players={players} teams={teams} ratingContext={ratingContext} isTeamTournament/>
    </div>;
}
