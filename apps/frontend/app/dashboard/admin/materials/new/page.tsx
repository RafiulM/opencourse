import { requireAuth } from '@/lib/auth-server'
import NewMaterialPageClient from './material-new-client'

export default async function NewMaterialPage() {
  // Check authentication on the server
  await requireAuth()

  return <NewMaterialPageClient />
}