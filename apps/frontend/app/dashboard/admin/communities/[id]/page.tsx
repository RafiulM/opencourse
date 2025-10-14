import { requireAuth } from '@/lib/auth-server'
import CommunityDetailPageClient from './community-detail-client'

interface CommunityDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <CommunityDetailPageClient id={id} />
}