"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signInWithGoogle } from "../../lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Chrome } from "lucide-react"

export default function LoginPageClient() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams?.get("returnUrl")

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")

    try {
      // Use the return URL from search params, or default to dashboard
      const callbackUrl = returnUrl || "/dashboard/admin"
      const result = await signInWithGoogle(callbackUrl)

      if (result.error) {
        setError(result.error.message || "Failed to sign in with Google")
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Or{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            {googleLoading ? "Signing in with Google..." : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}