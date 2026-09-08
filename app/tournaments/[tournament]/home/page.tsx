import {HomePage} from "@/components/homepage";
import {TournamentLoadError} from "@/components/tournament_load_error";
import {getTournamentInfo} from "@/lib/tournament_info";

export default async function TournamentPage({params}: {params: Promise<{tournament: string}>}) {
    const {tournament} = await params;
    const {data, error} = await getTournamentInfo(tournament);
    if (!data) return <TournamentLoadError error={error} />;
    // Rules are rendered on their own route, not on the tournament home page.
    const homeInfo = {...data};
    delete homeInfo.rules_info;
    return <HomePage tournament_info={homeInfo} initialNow={Date.now()} />;
}
