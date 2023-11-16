import {TournamentNavbar} from "@/components/navbar";

export default function HomeLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <TournamentNavbar/>
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
                {children}
            </main>
        </>
    )
}