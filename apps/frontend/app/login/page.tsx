import { getCurrentSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import LoginPageClient from './login-client'

export default async function LoginPage(props: {
  searchParams?: Promise<{ returnUrl?: string }>
}) {
  // Check if user is already authenticated (without redirecting)
  const session = await getCurrentSession()

  // If user is already authenticated, handle redirect to previous page
  if (session) {
    const searchParams = await props.searchParams
    const returnUrl = searchParams?.returnUrl

    // Handle redirect directly in the component
    if (returnUrl) {
      redirect(returnUrl)
    } else {
      redirect("/")
    }
  }

  // Otherwise show the login form
  return <LoginPageClient />
}