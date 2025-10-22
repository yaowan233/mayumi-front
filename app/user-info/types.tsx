// types/user.ts

export interface Badge {
  awarded_at: string;
  description: string;
  image_url: string;
  url: string;
}

export interface Variant {
  mode: string;
  variant: string;
  country_rank?: number;
  global_rank?: number;
  pp?: number;
}

export interface GradeCounts {
  ssh: number;
  ss: number;
  sh: number;
  s: number;
  a: number;
}

export interface Level {
  current: number;
  progress: number;
}

export interface UserStatistics {
  grade_counts: GradeCounts;
  hit_accuracy: number;
  is_ranked: boolean;
  level: Level;
  maximum_combo: number;
  play_count: number;
  play_time: number;
  pp: number;
  ranked_score: number;
  replays_watched_by_others: number;
  total_hits: number;
  total_score: number;
  global_rank?: number;
  country_rank?: number;
  badges?: Badge[];
  variants?: Variant[];
}

export interface RuleSets {
  osu?: UserStatistics;
  taiko?: UserStatistics;
  fruits?: UserStatistics;
  mania?: UserStatistics;
}

export interface OsuTeam {
  flag_url?: string;
  id: number;
  name: string;
  short_name: string;
}

export interface UserCompact {
  avatar_url: string;
  country_code: string;
  default_group: string;
  id: number;
  is_active: boolean;
  is_bot: boolean;
  is_deleted: boolean;
  is_online: boolean;
  is_supporter: boolean;
  last_visit?: string;
  profile_colour?: string;
  username: string;
  statistics?: UserStatistics;
  statistics_rulesets?: RuleSets;
  team?: OsuTeam;
}

export interface User extends UserCompact {
  cover_url?: string;
  has_supported?: boolean;
  join_date?: string;
  location?: string;
  occupation?: string;
  playmode?: "fruits" | "mania" | "osu" | "taiko";
  playstyle?: string[];
  badges?: Badge[];
}
