const MATCH_URL_PATTERN = /^https:\/\/osu\.ppy\.sh\/(?:community\/matches|mp)\/[1-9][0-9]*\/?(?:[?#]\S*)?$/;
const MATCH_URL_ERROR = "请输入 osu! MP 房间链接（https://osu.ppy.sh/community/matches/123 或 https://osu.ppy.sh/mp/123），不能填写谱面链接";

export function getMatchUrlError(value: string): string | null {
    const url = value.trim();
    return !url || MATCH_URL_PATTERN.test(url) ? null : MATCH_URL_ERROR;
}

export function normalizeMatchUrls(urls?: readonly string[] | null): string[] {
    const result = new Set<string>();
    for (const value of urls ?? []) {
        const error = getMatchUrlError(value);
        if (error) throw new Error(error);
        const url = value.trim();
        if (url) result.add(url);
    }
    return [...result];
}
