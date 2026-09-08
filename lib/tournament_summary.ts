import type {Tournament} from "../components/tournament_pic";

export function tournamentSummary(tournament: Tournament): Tournament {
    const {name, abbreviation, description, start_date, registration_start_time,
        end_date, pic_url, mode, status} = tournament;
    return {name, abbreviation, description, start_date, registration_start_time,
        end_date, pic_url, mode, status};
}
