import { requireAuth } from '@/lib/auth-server'
import EditPostPageClient from './post-edit-client'

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <EditPostPageClient id={id} />
}