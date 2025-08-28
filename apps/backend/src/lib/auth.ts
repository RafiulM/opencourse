import { db } from "../db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";


export const auth: ReturnType<typeof betterAuth> = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:5173",
        ...(process.env.TRUSTED_ORIGINS?.split(',') || [])
    ],
});