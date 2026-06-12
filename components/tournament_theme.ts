export const DEFAULT_TOURNAMENT_THEME_COLOR = "#006FEE";

export function normalizeTournamentThemeColor(color?: string | null) {
    const value = color?.trim();

    if (!value) {
        return undefined;
    }

    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : undefined;
}
