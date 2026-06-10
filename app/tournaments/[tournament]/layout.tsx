import {TournamentNavbar} from "@/components/navbar";

export default async function HomeLayout({
                                             children,
                                             params,
                                         }: {
    children: React.ReactNode
    params: Promise<{ tournament: string }>
}) {
    const {tournament} = await params
    return (
        <div>
            <TournamentNavbar tournament_name={tournament}/>
            <main className="w-full mx-auto px-6 pt-22 grow">
                {children}
            </main>
        </div>
    )
}
