"use client";

import {ScoreRankA, ScoreRankS, ScoreRankSS, ScoreRankX, ScoreRankXH} from "@/app/user-info/score-rank";
import RankDisplay from "@/app/user-info/rank-display";
import {User} from "@/app/user-info/types";
import CurrentUserContext from "@/app/user_context";
import GameModeIcon, {GameMode} from "@/components/gamemode_icon";
import {SearchIcon} from "@/components/icons";
import UserLevel from "@/components/user_level";
import {siteConfig} from "@/config/site";
import {Button, Input, Spinner} from "@heroui/react";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";

interface ModeData {
    name: GameMode;
    color: string;
    label: string;
}

const MODE_LIST: ModeData[] = [
    {name: "osu", color: "#ff66aa", label: "osu!"},
    {name: "taiko", color: "#f33", label: "taiko"},
    {name: "fruits", color: "#ffa500", label: "catch"},
    {name: "mania", color: "#6cf", label: "mania"},
];

const surfaceClass = "rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-950";
const mutedClass = "text-zinc-500 dark:text-zinc-400";

export default function TournamentHomePage() {
    const currentUser = useContext(CurrentUserContext);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [selectedMode, setSelectedMode] = useState<GameMode>("osu");
    const [searchName, setSearchName] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setIsSearching(true);
        try {
            setUserInfo(await getUserInfo(selectedMode, trimmedName));
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    }, [selectedMode]);

    const initialUsername = currentUser?.currentUser?.uid && !searchName && !userInfo?.username
        ? currentUser.currentUser.name
        : null;
    const currentUsername = userInfo?.username ?? null;

    useEffect(() => {
        if (!initialUsername) return;
        const timer = window.setTimeout(() => void handleSearch(initialUsername), 0);
        return () => window.clearTimeout(timer);
    }, [handleSearch, initialUsername]);

    useEffect(() => {
        if (!currentUsername) return;
        const timer = window.setTimeout(() => void handleSearch(currentUsername), 0);
        return () => window.clearTimeout(timer);
    }, [currentUsername, handleSearch, selectedMode]);

    const stats = userInfo?.statistics;
    const selectedModeData = useMemo(
        () => MODE_LIST.find((mode) => mode.name === selectedMode) ?? MODE_LIST[0],
        [selectedMode],
    );

    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
            <section className={`${surfaceClass} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 dark:bg-white/[0.05]">
                    {MODE_LIST.map((mode) => {
                        const selected = selectedMode === mode.name;
                        return (
                            <button
                                key={mode.name}
                                type="button"
                                aria-pressed={selected}
                                className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                    selected
                                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                                        : "text-zinc-600 hover:bg-white hover:text-primary dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                                }`}
                                onClick={() => setSelectedMode(mode.name)}
                            >
                                <GameModeIcon mode={mode.name} size={17} color={selected ? mode.color : "currentColor"} />
                                <span>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex min-w-0 gap-2 sm:w-[360px]">
                    <Input
                        placeholder="搜索 osu! 用户名"
                        value={searchName}
                        className="h-9"
                        onChange={(event) => setSearchName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") void handleSearch(searchName);
                        }}
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="primary"
                        className="h-9 w-9 min-w-9 rounded-lg"
                        isPending={isSearching}
                        onPress={() => handleSearch(searchName)}
                    >
                        {({isPending}) => isPending ? <Spinner color="current" size="sm" /> : <SearchIcon />}
                    </Button>
                </div>
            </section>

            {!userInfo && (
                <section className={`${surfaceClass} grid min-h-[360px] place-items-center p-8 text-center`}>
                    <div className="max-w-md">
                        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
                            <SearchIcon />
                        </div>
                        <h1 className="text-3xl font-black tracking-normal text-zinc-950 dark:text-white">玩家资料</h1>
                        <p className={`mt-3 text-sm leading-6 ${mutedClass}`}>搜索玩家，查看一张简洁的个人资料卡。</p>
                    </div>
                </section>
            )}

            {userInfo && stats && (
                <section
                    className={`${surfaceClass} overflow-hidden`}
                    style={{"--mode-color": selectedModeData.color} as React.CSSProperties}
                >
                    <div
                        className="relative h-44 bg-cover bg-center sm:h-56"
                        style={{backgroundImage: `url('${userInfo.cover_url || "https://www.loliapi.com/acg"}')`}}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/65 to-white/10 dark:from-zinc-950 dark:via-zinc-950/70 dark:to-zinc-950/10" />
                        <div className="absolute bottom-0 left-8 h-1 w-24 rounded-full bg-[var(--mode-color)]" />
                        <div className="absolute bottom-0 left-36 h-1 w-8 rounded-full bg-[var(--mode-color)] opacity-40" />
                        <div className="absolute right-8 top-8 hidden h-16 w-16 rounded-full border border-white/45 bg-white/10 backdrop-blur-sm dark:border-white/10 sm:block" />
                        <div className="absolute right-16 top-20 hidden h-2 w-24 rounded-full bg-[var(--mode-color)] opacity-70 sm:block" />
                    </div>

                    <div className="relative px-5 pb-5 sm:px-8 sm:pb-6">
                        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                                <img
                                    src={userInfo.avatar_url || `https://a.ppy.sh/${userInfo.id}`}
                                    alt={userInfo.username}
                                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-xl ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5 dark:border-zinc-950 dark:ring-white/10 sm:h-28 sm:w-28"
                                />
                                <div className="min-w-0 pb-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="truncate text-3xl font-black tracking-normal text-zinc-950 dark:text-white sm:text-4xl">
                                            {userInfo.username}
                                        </h1>
                                        <span className="rounded-md bg-[var(--mode-color)] px-2 py-1 text-xs font-bold text-white shadow-sm">
                                            {selectedModeData.label}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                        {userInfo.team?.flag_url && (
                                            <Badge>
                                                <img src={userInfo.team.flag_url} alt={userInfo.team.name} className="h-3 w-4 object-cover" />
                                                {userInfo.team.name}
                                            </Badge>
                                        )}
                                        <Badge>
                                            <img src={flagUrl(userInfo.country_code)} alt={userInfo.country_code} className="h-auto w-4" />
                                            地区排名 #{stats.country_rank || 0}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={`https://osu.ppy.sh/users/${userInfo.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-[var(--mode-color)] hover:text-[var(--mode-color)] dark:border-white/10 dark:text-zinc-200"
                            >
                                osu! 主页
                            </a>
                        </div>

                        <div className="relative mt-5 overflow-hidden rounded-xl bg-zinc-50/80 p-4 dark:bg-white/[0.04]">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--mode-color)] to-transparent opacity-60" />
                            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 border-r-4 border-t-4 border-[var(--mode-color)] opacity-25" />
                            <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 border-b-4 border-l-4 border-[var(--mode-color)] opacity-15" />
                            <div className="pointer-events-none absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-[var(--mode-color)] opacity-10 blur-2xl" />
                            <div className="grid gap-3 border-b border-zinc-200 pb-4 dark:border-white/[0.08] sm:grid-cols-4">
                                <CompactMetric label="全球排名" value={<RankDisplay user={userInfo} type="global" />} accent />
                                <CompactMetric label="PP" value={Math.round(stats.pp || 0).toLocaleString()} suffix="pp" />
                                <CompactMetric label="准确率" value={`${(stats.hit_accuracy || 0).toFixed(2)}%`} />
                                <CompactMetric label="游玩次数" value={stats.play_count?.toLocaleString()} />
                            </div>

                            <div className="grid gap-5 pt-4 lg:grid-cols-[minmax(0,1fr)_290px]">
                                <div className="min-w-0">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-white">
                                            <span className="h-4 w-1 rounded-full bg-[var(--mode-color)]" />
                                            成绩
                                        </h2>
                                        <span
                                            className="rounded-md px-2 py-1 text-xs font-bold"
                                            style={{backgroundColor: `${selectedModeData.color}1A`, color: selectedModeData.color}}
                                        >
                                            {selectedModeData.label}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        <GradeItem icon={<ScoreRankXH />} count={stats.grade_counts.ssh} />
                                        <GradeItem icon={<ScoreRankSS />} count={stats.grade_counts.ss} />
                                        <GradeItem icon={<ScoreRankX />} count={stats.grade_counts.sh} />
                                        <GradeItem icon={<ScoreRankS />} count={stats.grade_counts.s} />
                                        <GradeItem icon={<ScoreRankA />} count={stats.grade_counts.a} />
                                    </div>

                                    <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-zinc-200 pt-4 dark:border-white/[0.08] sm:grid-cols-2">
                                        <SmallStat label="Ranked 总分" value={stats.ranked_score?.toLocaleString()} />
                                        <SmallStat label="总分" value={stats.total_score?.toLocaleString()} />
                                        <SmallStat label="总点击数" value={stats.total_hits?.toLocaleString()} />
                                        <SmallStat label="回放观看" value={stats.replays_watched_by_others?.toLocaleString()} />
                                    </div>
                                </div>

                                <div className="flex min-w-0 flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-white/[0.08] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                                    <div className="flex items-center gap-4">
                                        <UserLevel level={stats.level.current || 0} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between text-sm font-bold">
                                                <span className="text-zinc-950 dark:text-white">等级 {stats.level.current || 0}</span>
                                                <span className={mutedClass}>{stats.level.progress || 0}%</span>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                                                <div className="h-full rounded-full bg-[var(--mode-color)]" style={{width: `${stats.level.progress || 0}%`}} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <SmallStat label="最大连击" value={stats.maximum_combo?.toLocaleString()} />
                                        <SmallStat label="游玩时长" value={formatPlayTime(stats.play_time || 0)} />
                                    </div>

                                    <div className="border-t border-zinc-200 pt-4 dark:border-white/[0.08]">
                                        <div className="mb-2 flex items-center justify-between">
                                            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-white">
                                                <span className="h-4 w-1 rounded-full bg-[var(--mode-color)]" />
                                                徽章
                                            </h2>
                                            <span className={`text-sm font-bold ${mutedClass}`}>{userInfo.badges?.length || 0}</span>
                                        </div>
                                        {userInfo.badges?.length ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {userInfo.badges.map((badge) => (
                                                    <a
                                                        key={`${badge.description}-${badge.awarded_at}`}
                                                        href={badge.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title={badge.description}
                                                        className="rounded-md bg-white p-1 transition-colors hover:ring-1 hover:ring-[var(--mode-color)] dark:bg-zinc-950"
                                                    >
                                                        <img src={badge.image_url} alt={badge.description} className="h-9 w-full rounded object-contain" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-sm ${mutedClass}`}>暂无徽章</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}

const Badge = ({children}: {children: React.ReactNode}) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-black/30">
        {children}
    </span>
);

const CompactMetric = ({
    label,
    value,
    suffix,
    accent,
}: {
    label: string;
    value?: React.ReactNode;
    suffix?: string;
    accent?: boolean;
}) => (
    <div className="group min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wide ${mutedClass}`}>{label}</p>
        <div className={`mt-1 truncate text-2xl font-black tabular-nums transition-transform duration-150 group-hover:translate-x-0.5 ${accent ? "text-primary" : "text-zinc-950 dark:text-white"}`}>
            {value || 0}
            {suffix && <span className={`ml-1 text-xs font-bold ${mutedClass}`}>{suffix}</span>}
        </div>
    </div>
);

const GradeItem = ({icon, count}: {icon: React.ReactNode; count?: number}) => (
    <div className="group flex min-w-0 flex-col items-center rounded-lg bg-white/70 px-2 py-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-zinc-950/60 dark:hover:bg-zinc-950">
        <div className="flex h-6 items-center">{icon}</div>
        <span className="mt-1.5 text-sm font-black tabular-nums text-zinc-950 transition-colors group-hover:text-[var(--mode-color)] dark:text-white">{count?.toLocaleString() || 0}</span>
    </div>
);

const SmallStat = ({label, value}: {label: string; value?: string | number}) => (
    <div className="group">
        <p className={`text-xs font-bold uppercase tracking-wide ${mutedClass}`}>{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm font-black text-zinc-950 transition-colors group-hover:text-[var(--mode-color)] dark:text-white">{value || 0}</p>
    </div>
);

function formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toLocaleString()}h ${minutes}m`;
}

function flagUrl(countryCode: string): string {
    if (!countryCode) return "";
    const chars = countryCode.toUpperCase().split("");
    const hexEmojiChars = chars.map((chr) => (chr.codePointAt(0)! + 127397).toString(16));
    return `https://osu.ppy.sh/assets/images/flags/${hexEmojiChars.join("-")}.svg`;
}

async function getUserInfo(mode: string, username: string): Promise<User> {
    const res = await fetch(`${siteConfig.backend_url}/api/user-info?mode=${mode}&username=${username}`, {
        method: "POST",
        credentials: "include",
    });
    return await res.json();
}
