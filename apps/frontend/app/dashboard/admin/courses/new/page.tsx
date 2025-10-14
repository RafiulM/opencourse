import { requireAuth } from '@/lib/auth-server'
import CourseNewPageClient from './course-new-client'

export default async function NewCoursePage() {
  // Check authentication on the server
  await requireAuth()

  return <CourseNewPageClient />
}