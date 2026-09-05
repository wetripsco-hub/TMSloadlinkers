import React from "react";
import Badge, { BadgeColor } from "./badge";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  badgeText?: string;
  badgeColor?: BadgeColor;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "plausible";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  badgeText,
  badgeColor = "success",
  subtitle,
  className = "",
  onClick,
  variant = "default",
}) => {
  if (variant === "plausible") {
    return (
      <div
        onClick={onClick}
        className={`rounded-md border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-xs ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badgeText && (
            <Badge color={badgeColor} size="sm">
              {badgeText}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <h4 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </h4>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-600">
            {icon}
          </div>
        </div>

        {subtitle && (
          <p className="mt-2 text-xs font-medium text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md md:p-6 ${
        onClick ? "cursor-pointer hover:border-brand-300" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
          {icon}
        </div>
        {badgeText && (
          <Badge color={badgeColor} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <h4 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </h4>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
