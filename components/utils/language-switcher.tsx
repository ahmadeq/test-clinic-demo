"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Globe } from "lucide-react";
import useLang from "@/components/hooks/useLang";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

const LANGUAGES = [
  { code: "ar" as const, label: "العربية" },
  { code: "en" as const, label: "English" },
];

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  const handleSelect = (locale: (typeof LANGUAGES)[number]["code"]) => {
    if (locale === lang) {
      setOpen(false);
      return;
    }

    const { pathname, query } = router;

    router
      .push({ pathname, query }, undefined, { locale, scroll: false })
      .finally(() => setOpen(false));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center mr-6 text-[#0055b1] cursor-pointer transition-transform",
            className
          )}
          aria-label="Change language"
        >
          <Globe className="h-8 w-8" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-2 mt-1" dir="ltr">
        <div className="flex flex-col gap-1">
          <div className=" absolute  right-[8px]  top-[-8px]  h-4  w-6  rotate-180  rounded-b-full  bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]" />

          {LANGUAGES.map(({ code, label }) => {
            const isActive = code === lang;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSelect(code)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer",
                  isActive
                    ? "bg-[#0055b1]/10 text-[#0055b1] cursor-default"
                    : "hover:bg-[#0055b1]/10 text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
