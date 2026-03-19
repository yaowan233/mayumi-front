import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const uuid = request.cookies.get('uuid')?.value
    if (!uuid) {
        return NextResponse.next()
    }

    const response = NextResponse.next()
    response.cookies.set('uuid', uuid, {
        path: '/',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })
    return response
}

export const config = {
    matcher: [
        // 排除静态资源和 Next.js 内部路由，只对页面请求续期
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
