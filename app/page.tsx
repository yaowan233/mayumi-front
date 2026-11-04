import { Navbar } from "@/components/navbar";
import TournamentListClient from "@/components/tournament_list_client";

export default function Home() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <div className="pointer-events-none absolute inset-x-0 top-16 h-64 bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <main className="relative flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                <TournamentListClient/>
            </main>
        </div>
    );
}
