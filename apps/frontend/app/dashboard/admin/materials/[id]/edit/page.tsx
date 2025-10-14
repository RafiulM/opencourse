import { requireAuth } from '@/lib/auth-server'
import EditMaterialPageClient from './material-edit-client'

interface EditMaterialPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMaterialPage({ params }: EditMaterialPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <EditMaterialPageClient id={id} />
}