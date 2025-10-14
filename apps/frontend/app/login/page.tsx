import { getCurrentSession } from '@/lib/auth-server'
import { handleLoginRedirect } from '@/lib/auth-server'
import LoginPageClient from './login-client'

export default async function LoginPage(props: {
  searchParams?: Promise<{ returnUrl?: string }>
}) {
  // Check if user is already authenticated (without redirecting)
  const session = await getCurrentSession()

  // If user is already authenticated, handle redirect to previous page
  if (session) {
    const searchParams = await props.searchParams
    return handleLoginRedirect(searchParams?.returnUrl)
  }

  // Otherwise show the login form
  return <LoginPageClient />
}