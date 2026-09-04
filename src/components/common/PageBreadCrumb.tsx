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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {pageTitle}
        </h1>
        <nav className="mt-1">
          <ol className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <li>
              <Link
                href="/loads"
                className="inline-flex items-center gap-1 hover:text-brand-500 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                TMS
              </Link>
            </li>
            {items ? (
              items.map((item, idx) => (
                <li key={idx} className="inline-flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-brand-500 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-800 font-medium dark:text-white">
                      {item.label}
                    </span>
                  )}
                </li>
              ))
            ) : (
              <li className="inline-flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-gray-400" />
                <span className="text-gray-800 font-medium dark:text-white">
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
