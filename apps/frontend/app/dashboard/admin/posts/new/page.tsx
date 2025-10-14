import { requireAuth } from '@/lib/auth-server'
import NewPostPageClient from './post-new-client'

export default async function NewPostPage() {
  // Check authentication on the server
  await requireAuth()

  return <NewPostPageClient />
}