import { requireAuth } from '@/lib/auth-server'
import ModuleDetailPageClient from './module-detail-client'

interface ModuleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <ModuleDetailPageClient id={id} />
}