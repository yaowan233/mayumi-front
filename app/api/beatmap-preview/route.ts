export const dynamic = 'force-dynamic';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getClientToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }
    const res = await fetch('https://osu.ppy.sh/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials&scope=public`,
    });
    if (!res.ok) throw new Error('Failed to get osu! token');
    const data: { access_token: string; expires_in: number } = await res.json();
    cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const map_id = searchParams.get('map_id');
    if (!map_id || isNaN(parseInt(map_id))) {
        return Response.json({ error: '无效的 map_id' }, { status: 400 });
    }
    try {
        const token = await getClientToken();
        const res = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${map_id}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) {
            return Response.json({ error: '找不到该地图，请确认 Beatmap ID 是否正确' }, { status: 404 });
        }
        const data = await res.json();
        return Response.json({
            map_id: String(data.id),
            map_set_id: String(data.beatmapset_id),
            map_name: `${data.beatmapset.artist} - ${data.beatmapset.title}`,
            diff_name: data.version,
            mapper: data.beatmapset.creator,
            star_rating: data.difficulty_rating.toFixed(2),
            bpm: String(data.bpm),
            ar: String(data.ar),
            od: String(data.accuracy),
            cs: String(data.cs),
            hp: String(data.drain),
            length: String(data.total_length),
            drain_time: String(data.hit_length),
            number: '',
        });
    } catch {
        return Response.json({ error: '查询地图时出错，请稍后重试' }, { status: 500 });
    }
}
