import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mt-2" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500">
              <li>
                <Link
                  href="/overview"
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  TMS
                </Link>
              </li>
              {breadcrumbs.map((item, idx) => (
                <li key={idx} className="inline-flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-800">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export default PageHeader;
