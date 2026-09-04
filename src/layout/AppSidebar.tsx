"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  Truck,
  Building2,
  Receipt,
  Landmark,
  FileText,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Package,
  LayoutDashboard,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "OPERATIONS",
    items: [
      { name: "Overview", path: "/overview", icon: LayoutDashboard },
      { name: "Loads", path: "/loads", icon: Package },
      { name: "Carriers", path: "/carriers", icon: Truck },
      { name: "Customers", path: "/customers", icon: Building2 },
    ],
  },
  {
    title: "FINANCIALS",
    items: [
      { name: "Invoices", path: "/invoices", icon: Receipt },
      { name: "Settlements", path: "/settlements", icon: Landmark },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Documents", path: "/documents", icon: FileText },
      { name: "Driver Tracking", path: "/track", icon: Navigation },
    ],
  },
];

export const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isVisibleExpanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => {
    if (path === "/loads" && (pathname === "/loads" || pathname.startsWith("/loads/"))) {
      return true;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-[#18171d] ${
        isMobileOpen
          ? "translate-x-0 w-[270px]"
          : "-translate-x-full lg:translate-x-0"
      } ${
        isVisibleExpanded ? "w-[270px]" : "w-[80px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5 dark:border-gray-800/80">
        <Link href="/loads" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {isVisibleExpanded && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                LOADLINKERS
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-brand-500 uppercase">
                Freight TMS
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {isVisibleExpanded ? (
              <h3 className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                {section.title}
              </h3>
            ) : (
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      title={!isVisibleExpanded ? item.name : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                      } ${!isVisibleExpanded ? "justify-center px-2" : ""}`}
                    >
                      <IconComponent
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          active
                            ? "text-brand-500 dark:text-brand-400"
                            : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                        }`}
                      />
                      {isVisibleExpanded && (
                        <span className="truncate">{item.name}</span>
                      )}
                      {isVisibleExpanded && active && (
                        <ChevronRight className="ml-auto h-4 w-4 text-brand-500 opacity-80" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom SaaS Trial Status */}
      {isVisibleExpanded && (
        <div className="border-t border-gray-100 p-3.5 dark:border-gray-800">
          <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50/70 to-indigo-50/40 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                14-Day Free Trial
              </span>
              <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                Active
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
              Self-serve TMS edition with unlimited dispatch & rate cons.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
