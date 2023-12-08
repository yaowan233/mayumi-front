import {TournamentNavbar} from "@/components/navbar";

export default function HomeLayout({
                                       children,
                                       params,
                                   }: {
    children: React.ReactNode;
    params: {
        tournament: string
    }
}) {
    return (
        <>
            <TournamentNavbar tournament_name={params.tournament}/>
            <main className="container mx-auto max-w-7xl pt-6 px-6 flex-grow">
                {children}
            </main>
        </>
    )
}