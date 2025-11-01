import { requireAuth } from '@/lib/auth-server'
import SettingsPageClient from './settings-client'

export default async function SettingsPage() {
  // Check authentication on the server
  await requireAuth()

  return <SettingsPageClient />
}