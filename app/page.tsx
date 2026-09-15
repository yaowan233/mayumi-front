import {fetchTournamentSummaries} from "@/lib/tournament_summary";
import {backendServerUrl} from "@/lib/backend_server";
import { Navbar } from "@/components/navbar";
import { Tournament } from "@/components/tournament_pic";
import TournamentListClient from "@/components/tournament_list_client";
import {Suspense} from "react";
import {TournamentListSkeleton} from "@/components/page_skeleton";

export const revalidate = 60;

export default function Home() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <div className="pointer-events-none absolute inset-x-0 top-16 h-64 bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <main className="relative flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                <Suspense fallback={<TournamentListSkeleton/>}>
                    <TournamentList/>
                </Suspense>
            </main>
        </div>
    );
}

async function TournamentList() {
    const publicTournaments = await GetPublicTournaments();
    return <TournamentListClient initialTournaments={publicTournaments}/>;
}

async function GetPublicTournaments(): Promise<Tournament[]> {
    try {
        return await fetchTournamentSummaries(backendServerUrl(), {next: {revalidate: 60}});
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}
