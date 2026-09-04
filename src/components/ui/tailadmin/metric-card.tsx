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
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 md:p-6 ${
        onClick ? "cursor-pointer hover:border-brand-300 dark:hover:border-brand-700" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white">
          {icon}
        </div>
        {badgeText && (
          <Badge color={badgeColor} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <h4 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {value}
          </h4>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
