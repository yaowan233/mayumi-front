import {TournamentNavbar} from "@/components/navbar";
import {getTournamentInfo} from "@/lib/tournament_info";
import {normalizeTournamentThemeColor} from "@/components/tournament_theme";

export default async function HomeLayout({
                                             children,
                                             params,
                                         }: {
    children: React.ReactNode
    params: Promise<{ tournament: string }>
}) {
    const {tournament} = await params
    const themeColor = await getTournamentThemeColor(tournament);
    const themeStyle = themeColor
        ? {
            "--accent": themeColor,
            "--tournament-page-bg": `
                radial-gradient(circle at 18% 0%, color-mix(in srgb, ${themeColor} 20%, transparent), transparent 34%),
                radial-gradient(circle at 82% 8%, color-mix(in srgb, ${themeColor} 12%, transparent), transparent 30%)
            `,
        } as React.CSSProperties
        : undefined;

    return (
        <div className="relative min-h-screen overflow-hidden" style={themeStyle}>
            {themeColor && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-0 opacity-80 dark:opacity-65"
                    style={{background: "var(--tournament-page-bg)"}}
                />
            )}
            <TournamentNavbar tournament_name={tournament}/>
            <main className="relative z-10 w-full mx-auto px-6 pt-22 grow">
                {children}
            </main>
        </div>
    )
}

async function getTournamentThemeColor(tournament: string) {
    const {data} = await getTournamentInfo(tournament);
    return data ? normalizeTournamentThemeColor(data.theme_color) : undefined;
}
