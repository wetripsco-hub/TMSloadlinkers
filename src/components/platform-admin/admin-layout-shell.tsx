"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  Ticket,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

interface AdminNavProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    name: "Overview",
    href: "/platform-admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Organizations",
    href: "/platform-admin/organizations",
    icon: Building2,
    exact: false,
  },
  {
    name: "Reset Requests",
    href: "/platform-admin/reset-requests",
    icon: KeyRound,
    exact: false,
  },
  {
    name: "Support Tickets",
    href: "/platform-admin/tickets",
    icon: Ticket,
    exact: false,
  },
  {
    name: "Audit Logs",
    href: "/platform-admin/audit-log",
    icon: ShieldAlert,
    exact: false,
  },
];

export function AdminLayoutShell({ children }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* High-Contrast Top Admin Header Banner */}
      <header className="sticky top-0 z-50 border-b border-indigo-950/80 bg-slate-950 px-4 sm:px-6 h-16 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/platform-admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                FreightLink
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Root
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Super Admin Console
              </span>
            </div>
          </Link>

          {/* Elevated Privileges Persistent Pill Marker */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider uppercase">
              PLATFORM ADMIN · SUPER ACCESS
            </span>
          </div>
        </div>

        {/* Right Action: Return to TMS Workspace */}
        <div className="flex items-center gap-3">
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all shadow-xs"
            title="Switch back to FreightLink tenant brokerage workspace"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to TMS Workspace</span>
          </Link>
        </div>
      </header>

      {/* Main App Body with Sidebar & Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Admin Navigation Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/90 shrink-0">
          <div className="p-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono font-semibold text-slate-400 tracking-wider uppercase">
              Core Platform
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Authority Layer:</span>
              <span className="font-mono text-indigo-400 font-semibold">SECURITY DEFINER</span>
            </div>
            <p className="text-[10px] leading-tight text-slate-400">
              Cross-tenant actions are audited and restricted to verified platform admins.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col w-72 max-w-[80vw] bg-slate-950 border-r border-slate-800 p-4 z-50">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Super Admin Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-indigo-600 text-white font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 text-slate-900 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayoutShell;
