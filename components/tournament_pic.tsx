"use client";

import NextImage from "next/image";
import NextLink from "next/link";

export interface Tournament {
    name: string;
    abbreviation: string;
    description: string;
    start_date: string;
    end_date: string;
    pic_url: string;
    mode: string;
    status: string;
}

const modeClassName = (mode: string) => {
    switch (mode.toLowerCase()) {
        case "mania":
            return "bg-primary text-white shadow-primary/30";
        case "osu":
            return "bg-fuchsia-500 text-white shadow-fuchsia-500/30";
        case "taiko":
            return "bg-red-500 text-white shadow-red-500/30";
        case "fruits":
            return "bg-emerald-500 text-emerald-950 shadow-emerald-500/30";
        case "all":
            return "bg-amber-400 text-amber-950 shadow-amber-400/30";
        default:
            return "bg-zinc-600 text-white shadow-zinc-600/30";
    }
};

export const modeLabel = (mode: string) => {
    switch (mode.toLowerCase()) {
        case "osu":
            return "osu!";
        case "taiko":
            return "Taiko";
        case "fruits":
            return "Fruits";
        case "mania":
            return "Mania";
        case "all":
            return "多模式";
        default:
            return mode || "其他";
    }
};

const gradientForName = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const palettes = [
        "from-violet-500 via-purple-500 to-fuchsia-500",
        "from-sky-500 via-blue-500 to-indigo-500",
        "from-rose-500 via-pink-500 to-purple-500",
        "from-emerald-500 via-teal-500 to-cyan-500",
        "from-amber-500 via-orange-500 to-red-500",
    ];
    return palettes[charCode % palettes.length];
};

export const TournamentFallback = ({ name, className }: { name: string; className?: string }) => {
    const initial = name?.[0]?.toUpperCase() || "?";
    return (
        <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientForName(name)} ${className || ""}`}
        >
            <span className="select-none text-5xl font-black text-white/30 drop-shadow-lg sm:text-6xl md:text-7xl">
                {initial}
            </span>
        </div>
    );
};

export const TournamentComponent = ({tournament, priority = false}: { tournament: Tournament; priority?: boolean }) => {
    const tournamentHref = `/tournaments/${tournament.abbreviation}/home`;
    const hasImage = !!tournament.pic_url;

    return (
        <NextLink
            href={tournamentHref}
            className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-transparent bg-zinc-100 shadow-sm shadow-zinc-200/70 outline-none transition hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-300/60 focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/25 dark:ring-1 dark:ring-white/10 dark:hover:ring-primary/40"
        >
            {tournament.status && tournament.status !== "approved" && (
                <span className="absolute left-3 top-3 z-30 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black uppercase text-amber-950 shadow-lg shadow-amber-400/30">
                    {tournament.status === "pending" ? "审核中" : "已驳回"}
                </span>
            )}
            <span
                className={`absolute right-3 top-3 z-30 inline-flex items-center justify-center rounded-full border border-white/15 px-2.5 py-1 text-center text-[11px] font-medium uppercase leading-none tracking-wide shadow-md backdrop-blur-sm ${modeClassName(tournament.mode || "")}`}
            >
                {modeLabel(tournament.mode || "")}
            </span>

            {hasImage ? (
                <>
                    <div className="absolute inset-0 z-0">
                        <NextImage
                            className="object-cover opacity-50 blur-2xl saturate-200"
                            src={tournament.pic_url}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    </div>
                    <div className="absolute inset-0 z-10">
                        <NextImage
                            className="object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-[1.06]"
                            src={tournament.pic_url}
                            alt={tournament.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={priority}
                        />
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 z-10 transition-transform duration-500 group-hover:scale-[1.06]">
                    <TournamentFallback name={tournament.name} />
                </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-2/3 bg-gradient-to-t from-black/95 via-black/55 to-transparent"/>

            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start gap-1 px-4 pb-3">
                <h4 className="line-clamp-1 text-lg font-bold leading-tight text-white drop-shadow-md transition-colors group-hover:text-primary">
                    {tournament.name}
                </h4>
                <p className="line-clamp-2 text-xs font-normal leading-relaxed text-zinc-300">
                    {tournament.description || "暂无详细描述..."}
                </p>
            </div>
        </NextLink>
    );
};
