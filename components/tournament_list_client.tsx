"use client"

import { useContext, useEffect, useState } from "react";
import useSWR from "swr";
import { TournamentComponent, Tournament } from "@/components/tournament_pic";
import { SectionTitle } from "@/app/page";
import CurrentUserContext from "@/app/user_context";
import { siteConfig } from "@/config/site";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());

function splitTournaments(list: Tournament[]) {
    const sorted = [...list].sort((a, b) =>
        new Date(a.start_date) < new Date(b.start_date) ? 1 : -1
    );
    return {
        ongoing: sorted.filter(t => new Date(t.end_date) >= new Date()),
        finished: sorted.filter(t => new Date(t.end_date) < new Date()),
    };
}

export default function TournamentListClient({ initialTournaments }: { initialTournaments: Tournament[] }) {
    const ctx = useContext(CurrentUserContext);
    const isLoggedIn = !!ctx?.currentUser;

    const { data: authedTournaments } = useSWR<Tournament[]>(
        isLoggedIn ? `${siteConfig.backend_url}/api/tournaments` : null,
        fetcher
    );

    const tournaments = authedTournaments ?? initialTournaments;
    const { ongoing, finished } = splitTournaments(tournaments);

    return (
        <>
            <section className="flex flex-col mb-16">
                <SectionTitle title="正在进行的比赛" />
                {ongoing.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoing.map((tournament, i) => (
                            <TournamentComponent key={tournament.name} tournament={tournament} priority={i < 3} />
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex justify-center items-center py-12 opacity-50">
                        <span className="text-sm font-medium tracking-[0.2em] text-default-500">
                            — 近期暂无赛事 —
                        </span>
                    </div>
                )}
            </section>

            <section className="flex flex-col">
                <div className="flex items-center gap-4 opacity-60 mb-8 px-4">
                    <div className="h-[1px] flex-grow bg-default-300"></div>
                    <h3 className="text-base font-bold text-default-500 tracking-[0.2em]">
                        历史赛事
                    </h3>
                    <div className="h-[1px] flex-grow bg-default-300"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {finished.map((tournament) => (
                        <TournamentComponent key={tournament.name} tournament={tournament} />
                    ))}
                </div>
            </section>
        </>
    );
}
