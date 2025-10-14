import { requireAuth } from '@/lib/auth-server'
import CommentsPageClient from './comments-client'

export default async function CommentsPage() {
  // Check authentication on the server
  await requireAuth()

  return <CommentsPageClient />
}