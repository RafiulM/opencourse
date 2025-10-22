import { db } from "../db"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

const isProduction = process.env.NODE_ENV === "production"

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  // Set base URL for production to help with cookie domain and redirects
  // This should be the backend URL where Better Auth is hosted
  baseURL: isProduction 
    ? process.env.BETTER_AUTH_URL || process.env.BACKEND_URL || "https://api.opencourse.id"
    : "http://localhost:5005",
  // Explicit base path for auth endpoints
  basePath: "/api/auth",
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
  advanced:{
    // Enable cross-subdomain cookies for production (api.opencourse.id -> app.opencourse.id)
    ...(isProduction && {
      crossSubDomainCookies: {
        enabled: true,
        domain: ".opencourse.id", // Note the leading dot for subdomain sharing
      },
    }),
    // Different cookie settings for development vs production
    defaultCookieAttributes: isProduction
      ? {
          sameSite: 'None', // Required for cross-subdomain cookies
          secure: true, // Required for SameSite=None (HTTPS only)
          path: "/", // Explicit path for cookies
        }
      : {
          sameSite: 'Lax', // More flexible for localhost development
          secure: false, // HTTP cookies (localhost)
          path: "/", // Explicit path for cookies
        },
  },
  trustedOrigins: [
    "http://localhost:3050",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://app.opencourse.id",
    "https://api.opencourse.id",
    ...(process.env.TRUSTED_ORIGINS?.split(",") || []),
  ]
})
