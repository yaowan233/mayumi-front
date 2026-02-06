import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { TournamentComponent, Tournament } from "@/components/tournament_pic";
import { cookies } from "next/headers";
export const dynamic = 'force-dynamic';


const SectionTitle = ({ title }: { title: string }) => (
    <div className="relative flex flex-col items-center justify-center mb-12 mt-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-primary/20 dark:bg-primary/40 blur-[40px] rounded-full pointer-events-none" />
        <h2 className="relative z-10 text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-zinc-800 via-zinc-800 to-zinc-500 dark:from-white dark:via-white dark:to-white/50 drop-shadow-sm italic px-2">
            {title}
        </h2>
    </div>
);

export default async function Home() {
    let tournaments_data = await GetTournamentInfo();

    tournaments_data = tournaments_data.sort((a, b) => {
        return new Date(a.start_date) < new Date(b.start_date) ? 1 : -1;
    });

    const ongoingTournaments = tournaments_data.filter((t) => new Date(t.end_date) >= new Date());
    const finishedTournaments = tournaments_data.filter((t) => new Date(t.end_date) < new Date());

    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24">
                {/* 正在进行 */}
                <section className="flex flex-col mb-16">
                    <SectionTitle title="正在进行的比赛" />
                    {ongoingTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ongoingTournaments.map((tournament) => (
                                <TournamentComponent key={tournament.name} tournament={tournament} />
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

                {/* 已结束 */}
                <section className="flex flex-col">
                    <div className="flex items-center gap-4 opacity-60 mb-8 px-4">
                        <div className="h-[1px] flex-grow bg-default-300"></div>
                        <h3 className="text-base font-bold text-default-500 tracking-[0.2em]">
                            历史赛事
                        </h3>
                        <div className="h-[1px] flex-grow bg-default-300"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {finishedTournaments.map((tournament) => (
                            <TournamentComponent key={tournament.name} tournament={tournament} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

async function GetTournamentInfo(): Promise<Tournament[]> {
    try {
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.toString();

        const res = await fetch(siteConfig.backend_url + '/api/tournaments', {
            headers: {
                'Cookie': cookieHeader
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) throw new Error('Failed to fetch data');
        return await res.json();
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}