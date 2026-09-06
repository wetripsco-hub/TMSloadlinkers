import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface PageBreadcrumbProps {
  pageTitle: string;
  items?: { label: string; href?: string }[];
  children?: React.ReactNode;
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  pageTitle,
  items,
  children,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {pageTitle}
        </h1>
        <nav className="mt-1">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500">
            <li>
              <Link
                href="/overview"
                className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                TMS
              </Link>
            </li>
            {items ? (
              items.map((item, idx) => (
                <li key={idx} className="inline-flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 font-medium">
                      {item.label}
                    </span>
                  )}
                </li>
              ))
            ) : (
              <li className="inline-flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-800 font-medium">
                  {pageTitle}
                </span>
              </li>
            )}
          </ol>
        </nav>
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};

export default PageBreadcrumb;
