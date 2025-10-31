import { siteConfig } from "@/config/site";

/**
 * Shared API functions for fetching tournament data
 * This module centralizes all API calls to avoid code duplication
 */

// Import types from their original locations
import type { TournamentInfo, RegistrationInfo } from "@/components/homepage";
import type { TournamentPlayers } from "@/app/tournaments/[tournament]/participants/page";
import type { TournamentRoundInfo } from "@/app/(home)/tournament-management/[tournament]/round/page";

/**
 * Fetch players for a tournament
 */
export async function getPlayers(
  tournament_name: string,
  revalidate_time: number = 0
): Promise<TournamentPlayers> {
  const res = await fetch(
    siteConfig.backend_url + "/api/players?tournament_name=" + tournament_name,
    { next: { revalidate: revalidate_time } }
  );
  return await res.json();
}

/**
 * Fetch tournament info
 */
export async function getTournamentInfo(
  tournament_name: string,
  revalidate_time: number = 10
): Promise<TournamentInfo> {
  const res = await fetch(
    siteConfig.backend_url + "/api/tournament-info?tournament_name=" + tournament_name,
    { next: { revalidate: revalidate_time } }
  );
  return await res.json();
}

/**
 * Fetch tournament round info
 */
export async function getRoundInfo(
  tournament_name: string,
  revalidate_time: number = 10
): Promise<TournamentRoundInfo[]> {
  const data = await fetch(
    siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
    { next: { revalidate: revalidate_time } }
  );
  return await data.json();
}

/**
 * Fetch registration info
 */
export async function getRegistrationInfo(
  tournament_name: string,
  revalidate_time: number = 10
): Promise<RegistrationInfo[]> {
  const res = await fetch(
    siteConfig.backend_url + `/api/get-registration-info?tournament_name=${tournament_name}`,
    { next: { revalidate: revalidate_time } }
  );
  return await res.json();
}
