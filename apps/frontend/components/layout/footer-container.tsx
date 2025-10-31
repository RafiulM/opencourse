"use client"

import { usePathname } from "next/navigation"

import { Footer } from "@/components/layout/footer"

const DASHBOARD_PREFIX = "/dashboard"

export function FooterContainer() {
  const pathname = usePathname()
  const shouldHideFooter = pathname?.startsWith(DASHBOARD_PREFIX)

  if (shouldHideFooter) {
    return null
  }

  return <Footer />
}
