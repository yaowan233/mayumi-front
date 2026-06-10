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

export const TournamentComponent = ({tournament, priority = false}: { tournament: Tournament; priority?: boolean }) => {
    const tournamentHref = `/tournaments/${tournament.abbreviation}/home`;
    const fallbackImage = "https://nextui.org/images/card-example-4.jpeg";
    const imgSrc = tournament.pic_url || fallbackImage;

    return (
        <NextLink
            href={tournamentHref}
            className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-transparent bg-zinc-100 shadow-sm shadow-zinc-200/70 outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-xl dark:shadow-black/35"
        >
            {tournament.status && tournament.status !== "approved" && (
                <span className="absolute left-3 top-3 z-30 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black uppercase text-amber-950 shadow-lg shadow-amber-400/30">
                    {tournament.status === "pending" ? "审核中" : "已驳回"}
                </span>
            )}
            <span
                className={`absolute right-3 top-3 z-30 inline-flex items-center justify-center rounded-full border border-white/15 px-2.5 py-1 text-center text-[11px] font-medium uppercase leading-none tracking-wide shadow-md backdrop-blur-sm ${modeClassName(tournament.mode || "")}`}
            >
                {tournament.mode}
            </span>

            <div className="absolute inset-0 z-0">
                <NextImage
                    className="object-cover opacity-50 blur-2xl saturate-200"
                    src={imgSrc}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
            </div>

            <div className="absolute inset-0 z-10">
                <NextImage
                    className="object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-[1.06]"
                    src={imgSrc}
                    alt={tournament.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={priority}
                />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-2/3 bg-gradient-to-t from-black/95 via-black/55 to-transparent"/>

            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start gap-1 px-4 pb-3">
                <h4 className="line-clamp-1 text-lg font-bold leading-tight text-white drop-shadow-md transition-colors group-hover:text-primary">
                    {tournament.name}
                </h4>
                <p className="line-clamp-2 text-[11px] font-normal leading-snug text-zinc-300">
                    {tournament.description || "暂无详细描述..."}
                </p>
            </div>
        </NextLink>
    );
};
