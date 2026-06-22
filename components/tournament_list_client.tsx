"use client"

import { useContext, useState } from "react";
import NextImage from "next/image";
import NextLink from "next/link";
import useSWR from "swr";
import { TournamentComponent, Tournament, modeLabel } from "@/components/tournament_pic";
import { SectionTitle } from "@/app/page";
import CurrentUserContext from "@/app/user_context";
import { siteConfig } from "@/config/site";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());
const fallbackImage = "/icon0.svg";

function splitTournaments(list: Tournament[]) {
    const sorted = [...list].sort((a, b) =>
        new Date(a.start_date) < new Date(b.start_date) ? 1 : -1
    );
    return {
        ongoing: sorted.filter(t => new Date(t.end_date) >= new Date()),
        finished: sorted.filter(t => new Date(t.end_date) < new Date()),
    };
}

const formatDate = (date: string) => new Date(date).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
});

const FeaturedTournament = ({ tournament }: { tournament: Tournament }) => {
    const imgSrc = tournament.pic_url || fallbackImage;

    return (
        <NextLink
            href={`/tournaments/${tournament.abbreviation}/home`}
            className="group grid overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm shadow-zinc-200/70 outline-none transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-zinc-200/80 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-black/25 dark:hover:border-primary/60 dark:hover:shadow-black/35 md:grid-cols-[1.55fr_1fr]"
        >
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                <div className="absolute inset-0">
                    <NextImage
                        src={imgSrc}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-cover opacity-45 blur-2xl saturate-150"
                        priority
                    />
                </div>
                <NextImage
                    src={imgSrc}
                    alt={tournament.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="relative z-10 object-contain drop-shadow-xl transition duration-500 group-hover:scale-[1.03]"
                    priority
                />
            </div>

            <div className="flex flex-col justify-between gap-6 p-5 md:p-6">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md shadow-primary/25">
                            进行中
                        </span>
                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                            {modeLabel(tournament.mode)}
                        </span>
                    </div>
                    <div>
                        <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tight text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
                            {tournament.name}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            {tournament.description || "暂无详细描述..."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-4 dark:border-white/10">
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </span>
                    <span className="text-sm font-bold text-primary">
                        进入比赛
                    </span>
                </div>
            </div>
        </NextLink>
    );
};

export default function TournamentListClient({ initialTournaments }: { initialTournaments: Tournament[] }) {
    const ctx = useContext(CurrentUserContext);
    const isLoggedIn = !!ctx?.currentUser;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMode, setSelectedMode] = useState("__all__");

    const { data: authedTournaments } = useSWR<Tournament[]>(
        isLoggedIn ? `${siteConfig.backend_url}/api/tournaments` : null,
        fetcher
    );

    const tournaments = authedTournaments ?? initialTournaments;
    const { ongoing, finished } = splitTournaments(tournaments);
    const [featuredOngoing, ...otherOngoing] = ongoing;
    const modes = Array.from(new Set(finished.map((tournament) => tournament.mode).filter(Boolean)))
        .sort((a, b) => modeLabel(a).localeCompare(modeLabel(b)));
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredFinished = finished.filter((tournament) => {
        const matchesMode = selectedMode === "__all__" || tournament.mode === selectedMode;
        const searchableText = [
            tournament.name,
            tournament.abbreviation,
            tournament.description,
            tournament.mode,
        ].join(" ").toLowerCase();

        return matchesMode && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });

    return (
        <>
            <section className="flex flex-col mb-16">
                <SectionTitle title="正在进行的比赛" count={ongoing.length} live />
                {ongoing.length > 0 ? (
                    ongoing.length === 1 ? (
                        <FeaturedTournament tournament={featuredOngoing} />
                    ) : ongoing.length === 2 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {ongoing.map((tournament, i) => (
                                <TournamentComponent key={tournament.name} tournament={tournament} priority={i < 2} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <FeaturedTournament tournament={featuredOngoing} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherOngoing.map((tournament, i) => (
                                    <TournamentComponent key={tournament.name} tournament={tournament} priority={i < 2} />
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="w-full flex justify-center items-center py-12">
                        <span className="text-sm font-medium tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            — 近期暂无赛事 —
                        </span>
                    </div>
                )}
            </section>

            <section className="flex flex-col">
                <div className="mb-7 flex flex-col gap-4 border-b border-zinc-200/80 pb-5 dark:border-white/10">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                                历史赛事
                            </h3>
                            <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                共 {finished.length} 个赛事，当前显示 {filteredFinished.length} 个
                            </p>
                        </div>
                        <label className="relative block w-full md:max-w-xs">
                            <span className="sr-only">搜索历史赛事</span>
                            <svg
                                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <circle cx="9" cy="9" r="6" />
                                <path d="m18 18-4.5-4.5" />
                            </svg>
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="搜索名称 / 简称 / 描述"
                                className="h-10 w-full rounded-full border border-zinc-200 bg-white/70 pl-10 pr-4 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-primary/60 focus:bg-white focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedMode("__all__")}
                            className={`h-8 cursor-pointer rounded-full px-3 text-xs font-bold transition hover:-translate-y-0.5 active:scale-95 ${
                                selectedMode === "__all__"
                                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                            }`}
                        >
                            全部
                        </button>
                        {modes.map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setSelectedMode(mode)}
                                className={`h-8 cursor-pointer rounded-full px-3 text-xs font-bold transition hover:-translate-y-0.5 active:scale-95 ${
                                    selectedMode === mode
                                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                                }`}
                            >
                                {modeLabel(mode)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredFinished.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredFinished.map((tournament) => (
                            <TournamentComponent key={tournament.name} tournament={tournament} />
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 px-4 text-sm font-medium text-zinc-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-500">
                        {finished.length === 0 ? "— 暂无历史赛事 —" : "没有找到相关比赛"}
                    </div>
                )}
            </section>
        </>
    );
}
