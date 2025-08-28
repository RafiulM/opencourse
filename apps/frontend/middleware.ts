import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const session = await getSessionCookie(request)
    console.log("middleware session", session)
    console.log(session)
    if (pathname.startsWith("/dashboard") && !session) {
        return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
}


export const config = {
    matcher: [
        "/dashboard/:path*",
    ]
}