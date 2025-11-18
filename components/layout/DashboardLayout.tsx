"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  title,
  description,
  actions,
  children,
  className,
}: DashboardLayoutProps) {
  const [showMobileNav, setShowMobileNav] = React.useState(false);

  const closeMobileNav = () => setShowMobileNav(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f9fc] via-white to-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:flex-row lg:gap-10 lg:pb-16 lg:pt-10">
        <SidebarNav className="lg:self-start" />

        <div className="flex-1">
          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ARISE
                </p>
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setShowMobileNav(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </header>
          </div>

          {showMobileNav ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                aria-hidden="true"
                onClick={closeMobileNav}
              />
              <SidebarNav
                variant="mobile"
                className="absolute inset-y-0 left-0 z-50"
                onNavigate={closeMobileNav}
              />
            </div>
          ) : null}

          <main className="flex-1">
            <div
              className={cn(
                "mx-auto w-full max-w-[1120px] rounded-3xl border border-border/60 bg-background/95 px-4 py-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:px-6 lg:px-10 lg:py-10",
                className
              )}
            >
              {actions ? (
                <div className="mb-6 flex items-center justify-end gap-3 lg:hidden">
                  {actions}
                </div>
              ) : null}

              <div className="mb-10 hidden items-start justify-between gap-8 lg:flex">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    ARISE Overview
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {title}
                  </h1>
                  {description ? (
                    <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
                      {description}
                    </p>
                  ) : null}
                </div>
                {actions ? (
                  <div className="flex shrink-0 items-center gap-3">
                    {actions}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 lg:mt-0">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
