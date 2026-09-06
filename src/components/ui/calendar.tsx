"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

// react-day-picker v10 ships unstyled (data-attribute selectors only, no
// default classes) -- every visual state below is wired through its
// `classNames` map rather than relying on a stylesheet import.
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center justify-between absolute inset-x-0 top-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm [&:has([data-range-end])]:rounded-r-md [&:has([data-range-start])]:rounded-l-md first:[&:has([data-range-middle])]:rounded-l-md last:[&:has([data-range-middle])]:rounded-r-md",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-md p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        range_end: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle: "[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:rounded-none",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        today: "[&>button]:border [&>button]:border-primary",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...chevronProps} />
          ) : (
            <ChevronRight className="size-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
