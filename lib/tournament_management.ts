import {TournamentInfo} from "@/components/homepage";
import {siteConfig} from "@/config/site";

export const ADMIN_UIDS = [3162675];
export const ADMIN_ROLE = "管理员";

export type TournamentStatus = "draft" | "pending" | "approved" | "rejected" | "hidden";

export interface ManagedTournament {
    tournament_name: string;
    abbreviation: string;
    roles: string[];
    status: TournamentStatus;
    reject_reason?: string;
    start_date?: string;
}

export const isAdminUser = (uid?: number) => uid !== undefined && ADMIN_UIDS.includes(uid);

export async function getTournamentManagementInfo(uid: number): Promise<ManagedTournament[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`, {
        next: {revalidate: 10},
    });
    return await data.json();
}

export async function getAdminTournamentManagementInfo(): Promise<ManagedTournament[]> {
    const res = await fetch(`${siteConfig.backend_url}/api/admin/tournaments`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch admin tournaments");

    const data: TournamentInfo[] = await res.json();
    return data.map((item) => ({
        tournament_name: item.name,
        abbreviation: item.abbreviation,
        roles: [ADMIN_ROLE],
        status: item.status,
        reject_reason: item.reject_reason,
        start_date: item.start_date,
    }));
}

export async function resolveManagedTournamentName(uid: number, tournamentAbbr: string): Promise<string> {
    const data = isAdminUser(uid)
        ? await getAdminTournamentManagementInfo()
        : await getTournamentManagementInfo(uid);

    return data.find((item) => item.abbreviation === tournamentAbbr)?.abbreviation ?? tournamentAbbr;
}
