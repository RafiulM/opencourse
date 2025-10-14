import { requireAuth } from '@/lib/auth-server'
import MaterialDetailPageClient from './material-detail-client'

interface MaterialDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <MaterialDetailPageClient id={id} />
}