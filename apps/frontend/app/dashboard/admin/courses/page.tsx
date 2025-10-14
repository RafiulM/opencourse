import { requireAuth } from '@/lib/auth-server'
import CoursesPageClient from './courses-client'

export default async function CoursesPage() {
  // Check authentication on the server
  await requireAuth()

  return <CoursesPageClient />
}