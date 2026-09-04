import React, { forwardRef } from "react";

// ==========================================
// Label
// ==========================================
export interface TailAdminLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const TailAdminLabel: React.FC<TailAdminLabelProps> = ({
  htmlFor,
  children,
  className = "",
  required,
  ...props
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
};

// ==========================================
// Input
// ==========================================
export interface TailAdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const TailAdminInput = forwardRef<HTMLInputElement, TailAdminInputProps>(
  ({ className = "", error, hint, startIcon, endIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs transition-colors placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-[#23222a] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-brand-400/20 ${
            startIcon ? "pl-10" : ""
          } ${endIcon ? "pr-10" : ""} ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500"
              : "border-gray-300 focus:border-brand-500 dark:border-gray-700 dark:focus:border-brand-500"
          } ${className}`}
          {...props}
        />
        {endIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
            {endIcon}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);
TailAdminInput.displayName = "TailAdminInput";

// ==========================================
// Select
// ==========================================
export interface Option {
  value: string;
  label: string;
}

export interface TailAdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Option[];
  placeholder?: string;
  error?: string;
}

export const TailAdminSelect = forwardRef<HTMLSelectElement, TailAdminSelectProps>(
  ({ className = "", options = [], placeholder, error, children, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 shadow-xs transition-colors placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-[#23222a] dark:text-white dark:focus:ring-brand-400/20 ${
            error
              ? "border-rose-500 focus:border-rose-500"
              : "border-gray-300 focus:border-brand-500 dark:border-gray-700 dark:focus:border-brand-500"
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-[#23222a]">
                  {opt.label}
                </option>
              ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);
TailAdminSelect.displayName = "TailAdminSelect";

// ==========================================
// Textarea
// ==========================================
export interface TailAdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const TailAdminTextarea = forwardRef<HTMLTextAreaElement, TailAdminTextareaProps>(
  ({ className = "", error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white p-3 text-sm text-gray-900 shadow-xs transition-colors placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-[#23222a] dark:text-white dark:focus:ring-brand-400/20 ${
            error
              ? "border-rose-500 focus:border-rose-500"
              : "border-gray-300 focus:border-brand-500 dark:border-gray-700 dark:focus:border-brand-500"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);
TailAdminTextarea.displayName = "TailAdminTextarea";

// ==========================================
// Button
// ==========================================
export interface TailAdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const TailAdminButton: React.FC<TailAdminButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  startIcon,
  endIcon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "h-9 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-11 px-4 text-sm gap-2 rounded-xl",
    lg: "h-12 px-5 text-base gap-2.5 rounded-xl",
  }[size];

  const variantStyles = {
    primary:
      "bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700 focus:ring-4 focus:ring-brand-500/20",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5",
    danger:
      "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800 focus:ring-4 focus:ring-rose-500/20",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        <>
          {startIcon && <span>{startIcon}</span>}
          {children}
          {endIcon && <span>{endIcon}</span>}
        </>
      )}
    </button>
  );
};
