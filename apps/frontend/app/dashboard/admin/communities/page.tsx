import { requireAuth } from '@/lib/auth-server'
import CommunitiesPageClient from './communities-client'

export default async function CommunitiesPage() {
  // Check authentication on the server
  await requireAuth()

  return <CommunitiesPageClient />
}