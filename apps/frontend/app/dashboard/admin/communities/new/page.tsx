import { requireAuth } from '@/lib/auth-server'
import NewCommunityPageClient from './communities-new-client'

export default async function NewCommunityPage() {
  // Check authentication on the server
  await requireAuth()

  return <NewCommunityPageClient />
}