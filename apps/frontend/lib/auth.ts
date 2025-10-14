import { createAuthClient } from "better-auth/react"

// Client-side auth
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Backend server URL
})

export const { signIn, signUp, signOut, useSession } = authClient

// Server-side auth - using the same client but configured for server calls
export const auth = authClient

// Google sign-in helper function
export const signInWithGoogle = async (callbackURL?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3050"
  const fullCallbackUrl = callbackURL ? `${baseUrl}${callbackURL}` : baseUrl
  console.log("Callback URL:", fullCallbackUrl)

  return await signIn.social({
    provider: "google",
    callbackURL: fullCallbackUrl,
  })
}
