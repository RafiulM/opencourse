import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL // Backend server URL,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession
} = authClient