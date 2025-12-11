import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { TournamentComponent, Tournament } from "@/components/tournament_pic";

const SectionTitle = ({ title }: { title: string }) => (
    <div className="relative flex flex-col items-center justify-center mb-12 mt-6">
        {/* 底部弥散光：一个模糊的蓝色圆点，营造氛围 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-primary/40 blur-[40px] rounded-full pointer-events-none" />

        {/* 文字：加上从白到灰的渐变，更有金属感 */}
        <h2 className="relative z-10 text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-sm italic">
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

                {/* 1. 正在进行 */}
                <section className="flex flex-col mb-16">
                    <SectionTitle title="正在进行的比赛" />

                    {ongoingTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ongoingTournaments.map((tournament) => (
                                <TournamentComponent key={tournament.name} tournament={tournament} />
                            ))}
                        </div>
                    ) : (
                        // 优化后的中文空状态
                        <div className="w-full flex justify-center items-center py-12 opacity-30">
                            <span className="text-sm font-medium tracking-[0.2em] text-white">
                                — 近期暂无赛事 —
                            </span>
                        </div>
                    )}
                </section>

                {/* 2. 已结束 */}
                <section className="flex flex-col">
                    <div className="flex items-center gap-4 opacity-30 mb-8 px-4">
                        <div className="h-[1px] flex-grow bg-white"></div>
                        <h3 className="text-base font-bold text-white tracking-[0.2em]">历史赛事</h3>
                        <div className="h-[1px] flex-grow bg-white"></div>
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
        const res = await fetch(siteConfig.backend_url + '/api/tournaments', { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed to fetch data');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}