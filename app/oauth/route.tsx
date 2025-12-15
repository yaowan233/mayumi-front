export const dynamic = 'force-dynamic';

import {redirect} from 'next/navigation'
import {cookies} from 'next/headers'
import {randomUUID} from "crypto";
import {siteConfig} from "@/config/site";

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return redirect('/')
    }

    const res = await fetch("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `client_id=${siteConfig.client_id}&client_secret=${siteConfig.client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=${siteConfig.web_url}/oauth`
    })

    const data: {
        token_type: string,
        expires_in: number,
        access_token: string,
        refresh_token: string
    } = await res.json()

    if (!data.access_token) {
        console.error("OAuth Error:", data);
        return redirect('/?error=oauth_failed')
    }

    const cookieStore = await cookies()
    const uuid = randomUUID()

    cookieStore.set('uuid', uuid, {
        path: '/',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
        httpOnly: true, // 安全加固：防止前端 JS 窃取
        sameSite: 'lax'
    })

    const backendRes = await fetch(
        siteConfig.backend_url +
        `/api/oauth?uuid=${uuid}&access_token=${data.access_token}&refresh_token=${data.refresh_token}&expires_in=${data.expires_in}`,
        { cache: 'no-store' } // 确保不缓存请求
    )

    if (!backendRes.ok) {
        console.error("Backend Sync Error");
        // 即使后端同步失败，通常也先让用户进去，或者跳转错误页
    }

    redirect('/')
}