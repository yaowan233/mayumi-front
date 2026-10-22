export const runtime = "nodejs";

// Only a numeric set ID is accepted; this is not a general-purpose URL proxy.
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
        return Response.json({detail: "无效的谱面集 ID"}, {status: 400});
    }
    const timeout = AbortSignal.timeout(55000);
    const signal = AbortSignal.any([request.signal, timeout]);
    try {
        const response = await fetch(`https://beatconnect.io/b/${id}/`, {
            signal, cache: "no-store", credentials: "omit",
        });
        if (!response.ok || !response.body || /text\/html|application\/json/i.test(response.headers.get("content-type") ?? "")) {
            await response.body?.cancel();
            return Response.json({detail: "备用镜像暂时无法提供谱面"}, {status: response.status === 404 ? 404 : 502});
        }
        // Stream the archive instead of buffering large files in server memory.
        return new Response(response.body, {headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${id}.osz"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        }});
    } catch {
        return Response.json({detail: "备用镜像连接失败或超时"}, {status: timeout.aborted ? 504 : 502});
    }
}
