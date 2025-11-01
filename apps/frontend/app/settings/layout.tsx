import { Navbar } from "@/components/navbar"
import { SettingsHeader } from "@/components/settings-header"
import { SettingsNavigation } from "@/components/settings-navigation"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <SettingsHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
