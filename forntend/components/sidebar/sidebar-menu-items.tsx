"use client";

import { LayoutDashboard, Wand2, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SidebarMenuItems() {
  const path = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Create",
      url: "/dashboard/create",
      icon: Wand2,
    },
    {
      title: "Project",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ].map((item) => ({
    ...item,
    active: path === item.url,
  }));

  const handleMenuClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={item.active}
            className={cn(
              "group relative h-10 w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-all",
              "hover:bg-primary/10 hover:text-primary",
              item.active && "bg-primary/15 text-primary shadow-sm"
            )}
          >
            <Link
              href={item.url}
              onClick={handleMenuClick}
              className="flex items-center gap-3"
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span className="truncate">{item.title}</span>

              {item.active && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
