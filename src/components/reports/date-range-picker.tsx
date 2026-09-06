"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { validateReportDateRange } from "@/lib/domain/reports";
import { cn } from "@/lib/utils";

const DATE_FORMAT = "yyyy-MM-dd";

type PresetKey = "this-month" | "last-month" | "last-30" | "last-90" | "custom";

const PRESET_LABELS: Record<PresetKey, string> = {
  "this-month": "This Month",
  "last-month": "Last Month",
  "last-30": "Last 30 Days",
  "last-90": "Last 90 Days",
  custom: "Custom",
};

const SELECTABLE_PRESETS: PresetKey[] = ["this-month", "last-month", "last-30", "last-90", "custom"];

function presetRange(preset: PresetKey, today: Date): { startDate: string; endDate: string } | null {
  switch (preset) {
    case "this-month":
      return { startDate: format(startOfMonth(today), DATE_FORMAT), endDate: format(today, DATE_FORMAT) };
    case "last-month": {
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), DATE_FORMAT),
        endDate: format(endOfMonth(lastMonth), DATE_FORMAT),
      };
    }
    case "last-30":
      return { startDate: format(subDays(today, 29), DATE_FORMAT), endDate: format(today, DATE_FORMAT) };
    case "last-90":
      return { startDate: format(subDays(today, 89), DATE_FORMAT), endDate: format(today, DATE_FORMAT) };
    case "custom":
      return null;
  }
}

function detectPreset(startDate: string, endDate: string, today: Date): PresetKey {
  for (const key of ["this-month", "last-month", "last-30", "last-90"] as const) {
    const range = presetRange(key, today);
    if (range && range.startDate === startDate && range.endDate === endDate) {
      return key;
    }
  }
  return "custom";
}

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
}

// Presets write directly to the URL (always a valid, already-computed range).
// Custom mode requires an explicit Apply, gated on validateReportDateRange --
// an invalid custom range never reaches the URL, it just shows inline.
export function DateRangePicker({ startDate, endDate }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = new Date();

  const [preset, setPreset] = useState<PresetKey>(() => detectPreset(startDate, endDate, today));
  const [customRange, setCustomRange] = useState<DayPickerRange | undefined>({
    from: new Date(`${startDate}T00:00:00`),
    to: new Date(`${endDate}T00:00:00`),
  });
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  function navigateTo(nextStartDate: string, nextEndDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", nextStartDate);
    params.set("endDate", nextEndDate);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePresetClick(key: PresetKey) {
    setError(null);

    if (key === "custom") {
      setPreset("custom");
      setIsPopoverOpen(true);
      return;
    }

    const range = presetRange(key, today);
    if (!range) return;

    setPreset(key);
    navigateTo(range.startDate, range.endDate);
  }

  function handleApplyCustom() {
    if (!customRange?.from || !customRange?.to) {
      setError("Select a start and end date");
      return;
    }

    const nextStartDate = format(customRange.from, DATE_FORMAT);
    const nextEndDate = format(customRange.to, DATE_FORMAT);
    const validation = validateReportDateRange(nextStartDate, nextEndDate);

    if (!validation.valid) {
      setError(validation.error ?? "Invalid date range");
      return;
    }

    setError(null);
    setIsPopoverOpen(false);
    navigateTo(nextStartDate, nextEndDate);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SELECTABLE_PRESETS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handlePresetClick(key)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            preset === key
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {PRESET_LABELS[key]}
        </button>
      ))}

      {preset === "custom" && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <CalendarIcon className="size-3.5" />
            {startDate} to {endDate}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={setCustomRange}
              numberOfMonths={2}
              disabled={{ after: today }}
            />
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            <div className="mt-2 flex justify-end">
              <Button type="button" size="sm" onClick={handleApplyCustom}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
