export interface Me {
    uid: number;
    name: string;
    country_code: string;
    playmode?: "osu" | "taiko" | "fruits" | "mania";
    statistics_rulesets: {
        "osu": UserStatistics;
        "taiko": UserStatistics;
        "fruits": UserStatistics;
        "mania": UserStatistics;
    }
}

interface UserStatistics {
    grade_counts: GradeCounts;
    hit_accuracy: number;
    is_ranked: boolean;
    level: number;
    maximum_combo: number;
    play_count: number;
    play_time: number;
    pp: number;
    ranked_score: number;
    replays_watched_by_others: number;
    total_hits: number;
    total_score: number;
    global_rank: number;
    country_rank: number;
    badges?: Badge[];

}

interface Badge {
    awarded_at: string;
    description: string;
    image_url: string;
    url: string;
}

interface GradeCounts {
    ssh: number;
    ss: number;
    sh: number;
    s: number;
    a: number;
}
