import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { authClient } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  console.log({ session })

  if (pathname.startsWith("/dashboard") && !session.data) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
}
