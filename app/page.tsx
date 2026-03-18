import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { TournamentComponent, Tournament } from "@/components/tournament_pic";
import TournamentListClient from "@/components/tournament_list_client";

export const revalidate = 60;

const SectionTitle = ({ title }: { title: string }) => (
    <div className="relative flex flex-col items-center justify-center mb-12 mt-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-primary/20 dark:bg-primary/40 blur-[40px] rounded-full pointer-events-none" />
        <h2 className="relative z-10 text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-zinc-800 via-zinc-800 to-zinc-500 dark:from-white dark:via-white dark:to-white/50 drop-shadow-sm italic px-2">
            {title}
        </h2>
    </div>
);

export { SectionTitle };

export default async function Home() {
    const publicTournaments = await GetPublicTournaments();

    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24">
                <TournamentListClient initialTournaments={publicTournaments} />
            </main>
        </div>
    );
}

async function GetPublicTournaments(): Promise<Tournament[]> {
    try {
        const res = await fetch(siteConfig.backend_url + '/api/tournaments', {
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        return await res.json();
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}
