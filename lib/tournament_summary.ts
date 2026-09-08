import type {Tournament} from "../components/tournament_pic";

export function tournamentSummary(tournament: Tournament): Tournament {
    const {name, abbreviation, description, start_date, registration_start_time,
        end_date, pic_url, mode, status} = tournament;
    return {name, abbreviation, description, start_date, registration_start_time,
        end_date, pic_url, mode, status};
}

export async function fetchTournamentSummaries(baseUrl: string, options?: RequestInit): Promise<Tournament[]> {
    let response = await fetch(`${baseUrl}/api/tournament-summaries`, options);
    // Support rolling deployments where the frontend reaches the old backend.
    if (response.status === 404) response = await fetch(`${baseUrl}/api/tournaments`, options);
    if (!response.ok) throw new Error(`Failed to fetch tournaments (${response.status})`);
    const tournaments: Tournament[] = await response.json();
    return tournaments.map(tournamentSummary);
}
