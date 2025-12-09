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
            <main className="w-full mx-auto pt-6 px-6 grow">
                {children}
            </main>
        </div>
    )
}
