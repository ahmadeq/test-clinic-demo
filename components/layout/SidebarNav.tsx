"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { ActivitySquare, LayoutDashboard, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

const navItems = [
  {
    label: "Overview",
    href: "/",
    Icon: LayoutDashboard,
  },
  {
    label: "Patients",
    href: "/patients",
    Icon: Users,
  },
  {
    label: "Payments",
    href: "/payments",
    Icon: Wallet,
  },
  {
    label: "Analytics",
    href: "/analytics",
    Icon: ActivitySquare,
  },
];

export function SidebarNav({
  onNavigate,
  variant = "desktop",
  className,
}: SidebarNavProps) {
  const router = useRouter();

  const baseClasses =
    variant === "desktop"
      ? "hidden h-full w-[236px] shrink-0 rounded-3xl border border-sidebar-border/70 bg-white/95 p-6 shadow-sm ring-1 ring-sidebar-ring/5 lg:sticky lg:top-10 lg:flex lg:flex-col"
      : "w-64 shrink-0 border border-sidebar-border/70 bg-white/95 px-5 py-6 shadow-xl";

  return (
    <aside className={cn(baseClasses, className)}>
      <div className="flex h-full flex-col gap-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Clinic Console
          </p>
          <h2 className="text-xl font-semibold">ARISE</h2>
          <p className="text-xs text-muted-foreground">
            Navigate between patient records, analytics, and billing in one
            place.
          </p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ href, label, Icon }) => {
            const isActive =
              router.pathname === href ||
              router.pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
