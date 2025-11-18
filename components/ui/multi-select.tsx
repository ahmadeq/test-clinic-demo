"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select options",
  className,
  emptyLabel = "No results found",
  searchPlaceholder = "Search…",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearSelection = () => onChange([]);

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedLabels = React.useMemo(
    () =>
      options
        .filter((option) => value.includes(option.value))
        .map((option) => option.label),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-between text-left font-normal",
            !value.length && "text-muted-foreground",
            className
          )}
        >
          <span className="line-clamp-1">
            {value.length ? selectedLabels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-3"
        sideOffset={8}
      >
        <div className="mb-3">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9"
            aria-label="Search options"
          />
        </div>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const checked = value.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground"
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleOption(option.value)}
                    aria-checked={checked}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              );
            })
          ) : (
            <p className="text-muted-foreground px-2 text-sm">{emptyLabel}</p>
          )}
        </div>
        {value.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="mt-3 w-full justify-center"
            onClick={clearSelection}
          >
            Clear selection
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
