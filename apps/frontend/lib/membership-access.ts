interface DetailedError {
  code?: string
  type?: string
  details?: {
    originalError?: string
  }
}

const MEMBERSHIP_REQUIRED_ORIGINAL_ERRORS = new Set([
  "Authentication required for community posts",
  "Access denied - community membership required",
])

const unwrapDetailedError = (error: unknown): DetailedError | null => {
  if (!error || typeof error !== "object") {
    return null
  }

  const typedError = error as DetailedError & { error?: unknown }

  if (typedError.code || typedError.type || typedError.details) {
    return typedError
  }

  if (typedError.error && typedError.error !== error) {
    return unwrapDetailedError(typedError.error)
  }

  return null
}

export function isMembershipRequiredOriginalError(
  originalError?: string | null
): boolean {
  return originalError ? MEMBERSHIP_REQUIRED_ORIGINAL_ERRORS.has(originalError) : false
}

export function isMembershipRequiredError(error: unknown): boolean {
  const detailedError = unwrapDetailedError(error)

  if (!detailedError) {
    return false
  }

  if (
    detailedError.code === "AUTHENTICATION_REQUIRED" ||
    detailedError.code === "ACCESS_DENIED"
  ) {
    return true
  }

  if (detailedError.type === "DATABASE_ERROR") {
    const originalError = detailedError.details?.originalError
    if (isMembershipRequiredOriginalError(originalError)) {
      return true
    }
  }

  const originalError = detailedError.details?.originalError
  return isMembershipRequiredOriginalError(originalError)
}
