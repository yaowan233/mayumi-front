"use client";

import {MappoolsComponents, Stage} from "@/components/mappools";
import {useTournamentResource} from "@/lib/use_browser_resource";
import {MappoolSkeleton} from "@/components/page_skeleton";
import {TournamentLoadError} from "@/components/tournament_load_error";


export default function MapPollsPage() {
    const {data, error, isLoading} = useTournamentResource<Stage[]>("/api/map_pools");
    if (error) return <TournamentLoadError error={error.message}/>;
    if (isLoading) return <MappoolSkeleton/>;
    return (
        <MappoolsComponents tabs={data ?? []}/>
    )
}
