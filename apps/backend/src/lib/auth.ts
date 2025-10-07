import { db } from "../db"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5005/api/auth/callback/google",
    },
  },
  trustedOrigins: [
    "http://localhost:3050",
    "http://localhost:3000",
    "http://localhost:5173",
    ...(process.env.TRUSTED_ORIGINS?.split(",") || []),
  ],
})
