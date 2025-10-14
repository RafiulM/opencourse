import { requireAuth } from '@/lib/auth-server'
import EditCoursePageClient from './course-edit-client'

interface EditCoursePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <EditCoursePageClient id={id} />
}