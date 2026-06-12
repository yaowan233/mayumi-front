import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { TournamentComponent, Tournament } from "@/components/tournament_pic";
import TournamentListClient from "@/components/tournament_list_client";

export const revalidate = 60;

const SectionTitle = ({ title, count }: { title: string; count?: number }) => (
    <div className="mb-6 mt-4 flex items-center gap-2 sm:mb-8 sm:justify-center sm:gap-4">
        <div className="hidden h-px w-12 bg-zinc-300 dark:bg-white/15 sm:block" />
        <h2 className="shrink-0 whitespace-nowrap text-xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            {title}
        </h2>
        {typeof count === "number" && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {count}
            </span>
        )}
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            Live
        </span>
        <div className="h-px min-w-6 flex-1 bg-zinc-300 dark:bg-white/15 sm:w-12 sm:flex-none" />
    </div>
);

export { SectionTitle };

export default async function Home() {
    const publicTournaments = await GetPublicTournaments();

    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 pt-26 pb-24">
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
