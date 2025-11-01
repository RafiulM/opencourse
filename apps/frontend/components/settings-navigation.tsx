'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  User,
  Shield,
  Bell,
  Palette,
  Database,
  HelpCircle,
  CreditCard,
  Globe
} from "lucide-react"

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings",
    icon: User,
    description: "Manage your profile information"
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password and authentication settings"
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email and push notification preferences"
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    description: "Theme and display preferences"
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Globe,
    description: "Privacy and data sharing settings"
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Subscription and payment methods"
  },
  {
    title: "Data & Storage",
    href: "/settings/data",
    icon: Database,
    description: "Download your data and manage storage"
  },
  {
    title: "Help & Support",
    href: "/settings/help",
    icon: HelpCircle,
    description: "Get help and contact support"
  }
]

interface SettingsNavigationProps {
  className?: string
}

export function SettingsNavigation({ className }: SettingsNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Settings</h3>
        <p className="text-xs text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-1">
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/settings" && pathname.startsWith(item.href))

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                isActive && "bg-secondary border-secondary-foreground/20"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}