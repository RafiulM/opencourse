import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname, search } = new URL(request.url)

  // Create a new response and add custom headers for server components
  const response = NextResponse.next()

  // Set headers that auth-server.ts expects
  response.headers.set("x-pathname", pathname)
  response.headers.set("x-search-params", search.slice(1)) // Remove '?' prefix

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
