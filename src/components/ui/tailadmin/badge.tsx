import React from "react";

export type BadgeVariant = "light" | "solid";
export type BadgeSize = "sm" | "md";
export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  className = "",
  children,
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium transition-colors";

  const sizeStyles = {
    sm: "text-xs py-0.5 px-2",
    md: "text-xs font-semibold py-1 px-2.5",
  };

  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 border border-brand-200/50 dark:border-brand-500/20",
      success:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20",
      error:
        "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20",
      warning:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20",
      info: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-200/50 dark:border-sky-500/20",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200/50 dark:border-white/10",
      dark: "bg-gray-800 text-gray-200 dark:bg-gray-700 dark:text-white border border-gray-700",
    },
    solid: {
      primary: "bg-brand-600 text-white shadow-sm",
      success: "bg-emerald-600 text-white shadow-sm",
      error: "bg-rose-600 text-white shadow-sm",
      warning: "bg-amber-500 text-white shadow-sm",
      info: "bg-sky-600 text-white shadow-sm",
      light: "bg-gray-200 text-gray-800",
      dark: "bg-gray-900 text-white",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${className}`}>
      {startIcon && <span className="inline-flex items-center mr-0.5">{startIcon}</span>}
      {children}
      {endIcon && <span className="inline-flex items-center ml-0.5">{endIcon}</span>}
    </span>
  );
};

export default Badge;
