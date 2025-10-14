import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Server-side authentication check for protected routes
 * Returns the session if authenticated, redirects to login if not
 */
export async function requireAuth() {
  const session = await auth.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  if (!session.data) {
    // Get the requested URL from search params instead of referer (Next.js 15+ pattern)
    const requestHeaders = await headers()
    const requestUrl = requestHeaders.get("x-pathname")
    const searchParams = requestHeaders.get("x-search-params")
    const returnUrl = searchParams
      ? `${requestUrl}?${searchParams}`
      : requestUrl

    // Redirect to login page with return URL as search param
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"
    redirect(loginUrl)
  }

  return session
}

/**
 * Get current session without redirecting
 * Returns the session if authenticated, null if not
 */
export async function getCurrentSession() {
  const session = await auth.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  return session.data ? session : null
}

/**
 * Handle redirect after successful login
 * Reads the returnUrl cookie and redirects the user to their original destination
 */
export async function handleLoginRedirect(returnUrl?: string) {
  // If a return URL is provided, redirect there
  if (returnUrl) {
    redirect(returnUrl)
  } else {
    // Default redirect after login
    redirect("/dashboard/admin")
  }
}
