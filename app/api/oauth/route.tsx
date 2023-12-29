import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { randomUUID } from "crypto";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const res = await fetch("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `client_id=28516&client_secret=wCbkMYjnW0GCjdc6Dw7e11M7KpIOHBi9b8xOyAKx&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:3000/api/oauth`
    })
    const data: {token_type:string, expires_in: number, access_token: string, refresh_token: string} =  await res.json()
    console.log(data.expires_in)
    const cookieStore = cookies()
    const uuid = randomUUID()
    cookieStore.set('uuid', uuid, { path: '/' , expires: new Date(Date.now() + 30 * 60 * 60 * 24 * 1000)})
    await fetch(`http://localhost:8421/api/oauth?uuid=${uuid}&access_token=${data.access_token}&refresh_token=${data.refresh_token}`)
    redirect('/')
}
