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
            <main className="w-full mx-auto pt-6 px-6 flex-grow">
                {children}
            </main>
        </>
    )
}
