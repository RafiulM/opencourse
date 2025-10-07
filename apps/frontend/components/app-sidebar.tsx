"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCamera,
  IconChartBar,
  IconChevronDown,
  IconChevronRight,
  IconDashboard,
  IconDatabase,
  IconDeviceLaptop,
  IconFileAi,
  IconFileDescription,
  IconFileText,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconMessageCircle,
  IconMoon,
  IconPlus,
  IconReport,
  IconSearch,
  IconSettings,
  IconSun,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/lib/auth"
import { useTheme } from "next-themes"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      icon: IconDashboard,
    },
    {
      title: "Communities",
      url: "/dashboard/admin/communities",
      icon: IconUsers,
    },
    {
      title: "Courses",
      url: "/dashboard/admin/courses",
      icon: IconFolder,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "New Community",
      url: "/dashboard/admin/communities/new",
      icon: IconUsers,
    },
    {
      name: "New Course",
      url: "/dashboard/admin/courses/new",
      icon: IconFolder,
    },
    {
      name: "New Post",
      url: "/dashboard/admin/posts/new",
      icon: IconFileText,
    },
  ],
}

function SidebarThemeToggle() {
  const { isMobile } = useSidebar()
  const { theme, resolvedTheme, setTheme } = useTheme()

  const activeTheme = theme ?? resolvedTheme ?? "system"

  const ActiveIcon = React.useMemo(() => {
    if (activeTheme === "light") return IconSun
    if (activeTheme === "dark") return IconMoon
    return IconDeviceLaptop
  }, [activeTheme])

  const subtitle = React.useMemo(() => {
    if (activeTheme === "system") {
      return `System (${resolvedTheme ?? "light"})`
    }
    return activeTheme === "dark" ? "Dark mode" : "Light mode"
  }, [activeTheme, resolvedTheme])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex-col items-start gap-1">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <ActiveIcon className="size-4" />
                  <span className="text-sm font-medium leading-none">
                    Theme
                  </span>
                </div>
                <IconChevronRight className="size-4" />
              </div>
              <span className="text-muted-foreground text-xs">{subtitle}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48"
            side={isMobile ? "bottom" : "right"}
            align={"end"}
            sideOffset={isMobile ? 8 : 12}
          >
            <DropdownMenuRadioGroup
              value={activeTheme}
              onValueChange={setTheme}
            >
              <DropdownMenuRadioItem
                value="light"
                className="flex items-center gap-2"
              >
                <IconSun className="size-4" />
                <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="dark"
                className="flex items-center gap-2"
              >
                <IconMoon className="size-4" />
                <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="system"
                className="flex items-center gap-2"
              >
                <IconDeviceLaptop className="size-4" />
                <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Opencourse</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarThemeToggle />
        <NavUser
          user={{
            name: user?.name || "",
            email: user?.email || "",
            avatar: user?.image || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
