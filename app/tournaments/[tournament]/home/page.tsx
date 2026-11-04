"use client";

import {HomePage} from "@/components/homepage";
import {TournamentLoadError} from "@/components/tournament_load_error";
import {useTournamentInfo} from "@/lib/tournament_info";
import {OverviewSkeleton} from "@/components/page_skeleton";

export default function TournamentPage() {
    const {data, error, isLoading} = useTournamentInfo();
    if (error) return <TournamentLoadError error={error.message}/>;
    if (isLoading) return <OverviewSkeleton/>;
    if (!data) return <TournamentLoadError error="比赛不存在"/>;
    // Rules are rendered on their own route, not on the tournament home page.
    const homeInfo = {...data};
    delete homeInfo.rules_info;
    return <HomePage tournament_info={homeInfo}/>;
}
