import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Backend server URL,
})

export const { signIn, signUp, signOut, useSession } = authClient

// Google sign-in helper function
export const signInWithGoogle = async (callbackURL?: string) => {
  return await signIn.social({
    provider: "google",
    callbackURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3050/",
  })
}
