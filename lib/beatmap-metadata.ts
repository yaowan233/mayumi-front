import { ProxyAgent } from "undici";

type Metadata = { title: string; artist: string; version: string; beatmapset_id: number };
type Cached = { value: Metadata | null; expires: number };

export function createMetadataLoader(fetcher: typeof fetch = fetch) {
    const cache = new Map<number, Cached>();
    let token: { value: string; expires: number } | undefined;
    let pendingToken: Promise<string> | undefined;

    async function getToken(): Promise<string> {
        if (token && token.expires > Date.now()) return token.value;
        if (pendingToken) return pendingToken;
        pendingToken = (async () => {
            const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
            const secret = process.env.CLIENT_SECRET;
            if (!clientId || !secret) throw new Error("Metadata credentials unavailable");
            const response = await fetcher("https://osu.ppy.sh/oauth/token", {
                method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: "client_credentials", scope: "public" }),
            });
            if (!response.ok) throw new Error("Metadata authentication unavailable");
            const data = await response.json();
            if (typeof data.access_token !== "string" || !data.access_token || !Number.isFinite(data.expires_in)) throw new Error("Invalid metadata token");
            token = { value: data.access_token, expires: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
            return token.value;
        })();
        try { return await pendingToken; }
        finally { pendingToken = undefined; }
    }

    return async function loadMetadata(ids: number[]): Promise<Map<number, Metadata>> {
        const requested = [...new Set(ids)].filter(id => Number.isSafeInteger(id) && id > 0).slice(0, 50);
        const missing = requested.filter(id => !cache.has(id) || cache.get(id)!.expires <= Date.now());
        if (missing.length) {
            const found = new Map<number, Metadata>();
            let success = false;
            try {
                const accessToken = await getToken();
                const url = new URL("https://osu.ppy.sh/api/v2/beatmaps");
                missing.forEach(id => url.searchParams.append("ids[]", String(id)));
                const response = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(8000),
                    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } });
                if (response.status === 401) token = undefined;
                if (!response.ok) throw new Error("Metadata service unavailable");
                const data = await response.json();
                if (!Array.isArray(data.beatmaps)) throw new Error("Invalid metadata response");
                for (const item of data.beatmaps) {
                    if (!item || !missing.includes(item.id) || !Number.isSafeInteger(item.beatmapset_id) || item.beatmapset_id <= 0) continue;
                    const metadata = { title: item.beatmapset?.title, artist: item.beatmapset?.artist, version: item.version, beatmapset_id: item.beatmapset_id };
                    if ([metadata.title, metadata.artist, metadata.version].every(value => typeof value === "string" && value.trim())) found.set(item.id, metadata);
                }
                success = true;
            } catch {
                success = false;
            }
            for (const id of missing) {
                const value = found.get(id) ?? null;
                cache.delete(id);
                cache.set(id, { value, expires: Date.now() + (value ? 86400000 : success ? 300000 : 30000) });
            }
            while (cache.size > 1000) cache.delete(cache.keys().next().value!);
        }
        return new Map(requested.flatMap(id => {
            const value = cache.get(id)?.value;
            return value ? [[id, value] as const] : [];
        }));
    };
}

let proxyAgent: ProxyAgent | undefined;
const metadataFetch: typeof fetch = (input, init) => {
    const proxy = process.env.OSU_METADATA_PROXY_URL;
    if (!proxy) return fetch(input, init);
    proxyAgent ??= new ProxyAgent(proxy);
    const options: RequestInit & { dispatcher: ProxyAgent } = { ...init, dispatcher: proxyAgent };
    return fetch(input, options);
};

export const loadBeatmapMetadata = createMetadataLoader(metadataFetch);
