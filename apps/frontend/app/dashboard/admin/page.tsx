import { requireAuth } from '@/lib/auth-server'
import AdminDashboardClient from './admin-dashboard-client'

export default async function AdminDashboard() {
  // Check authentication on the server
  await requireAuth()

  return <AdminDashboardClient />
}