import { requireAuth } from '@/lib/auth-server'
import CourseDetailPageClient from './course-detail-client'

interface CourseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  // Check authentication on the server
  await requireAuth()

  // Extract the id from params
  const { id } = await params

  return <CourseDetailPageClient id={id} />
}