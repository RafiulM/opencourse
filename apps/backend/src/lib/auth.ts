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
    "https://app.opencourse.id",
    ...(process.env.TRUSTED_ORIGINS?.split(",") || []),
  ],
  crossSubDomainCookies: {
    enabled: true,
    domain: ".opencourse.id",
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 24 * 60 * 60, // 1 day
    cookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
})
