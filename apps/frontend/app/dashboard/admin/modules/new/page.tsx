import { requireAuth } from '@/lib/auth-server'
import ModuleNewPageClient from './module-new-client'

export default async function NewModulePage() {
  // Check authentication on the server
  await requireAuth()

  return <ModuleNewPageClient />
}