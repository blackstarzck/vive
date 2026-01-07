"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Home, 
  BookOpen, 
  Search, 
  Tags, 
  Settings, 
  Menu,
  X,
  Key,
  Link2
} from "lucide-react"
import { useState, useEffect } from "react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: "대시보드",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "내 하이라이트",
      icon: BookOpen,
      href: "/highlights",
      active: pathname.startsWith("/highlights"),
    },
    {
      label: "지식 검색",
      icon: Search,
      href: "/search",
      active: pathname.startsWith("/search"),
    },
    {
      label: "주제",
      icon: Tags,
      href: "/topics",
      active: pathname.startsWith("/topics"),
    },
    {
      label: "API 키",
      icon: Key,
      href: "/settings/api-keys",
      active: pathname === "/settings/api-keys",
    },
    {
      label: "Notion 연동",
      icon: Link2,
      href: "/settings/notion",
      active: pathname === "/settings/notion",
    },
    {
      label: "설정",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ]

  return (
    <div className={cn("pb-12 min-h-screen bg-sidebar border-r border-sidebar-border", className)}>
      <div className="space-y-4 py-4">
        <div className="px-6 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">VIVE</span>
          </Link>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={item.active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  item.active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                asChild
                onClick={isMobile ? onClose : undefined}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
