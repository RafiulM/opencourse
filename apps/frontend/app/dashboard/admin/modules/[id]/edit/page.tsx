import { requireAuth } from '@/lib/auth-server'
import ModuleEditPageClient from './module-edit-client'

interface EditModulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <ModuleEditPageClient id={id} />
}