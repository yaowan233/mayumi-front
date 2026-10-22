import JSZip from "jszip";

export const DOWNLOAD_MIRRORS = [
    {id: "osu-direct", name: "osu.direct", url: (id: string) => `https://osu.direct/api/d/${id}`},
    {id: "sayobot", name: "小夜", url: (id: string) => `https://dl.sayobot.cn/beatmaps/download/full/${id}`},
    {id: "beatconnect", name: "Beatconnect", url: (id: string) => `/downloads/beatmapsets/${id}`},
] as const;
export type MirrorPreference = "auto" | typeof DOWNLOAD_MIRRORS[number]["id"];

export async function downloadBeatmapset(id: string, {
    preferred = "auto",
    fetcher = fetch,
    timeoutMs = 60000,
}: {preferred?: MirrorPreference; fetcher?: typeof fetch; timeoutMs?: number} = {}): Promise<ArrayBuffer> {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
        throw new Error("无效的谱面集 ID");
    }
    const mirrors = [...DOWNLOAD_MIRRORS].sort((a, b) => Number(b.id === preferred) - Number(a.id === preferred));
    const failures: string[] = [];
    for (const mirror of mirrors) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetcher(mirror.url(id), {signal: controller.signal, credentials: "omit", cache: "no-store"});
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const buffer = await response.arrayBuffer();
            const archive = await JSZip.loadAsync(buffer, {checkCRC32: true});
            if (!Object.values(archive.files).some(file => !file.dir && /\.osu$/i.test(file.name))) {
                throw new Error("文件不包含谱面");
            }
            return buffer;
        } catch (error) {
            const reason = controller.signal.aborted ? "请求超时" : error instanceof Error ? error.message : "下载失败";
            failures.push(`${mirror.name}: ${reason}`);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error(`所有镜像均下载失败\n${failures.join("\n")}`);
}
