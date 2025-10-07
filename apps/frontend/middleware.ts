import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { authClient } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  if (pathname.startsWith("/dashboard") && !data) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
}
