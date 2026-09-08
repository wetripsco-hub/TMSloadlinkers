"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { createClient } from "@/lib/supabase/client";
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
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
  tourId?: string;
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
      { name: "Loads", path: "/loads", icon: Package, tourId: "nav-loads" },
      { name: "Carriers", path: "/carriers", icon: Truck, tourId: "nav-carriers" },
      { name: "Customers", path: "/customers", icon: Building2 },
    ],
  },
  {
    title: "FINANCIALS",
    items: [
      { name: "Invoices", path: "/invoices", icon: Receipt, tourId: "nav-invoices" },
      { name: "Settlements", path: "/settlements", icon: Landmark },
      { name: "Reports", path: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Documents", path: "/documents", icon: FileText },
      { name: "Driver Tracking", path: "/driver-tracking", icon: Navigation, tourId: "nav-tracking" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", path: "/settings/organization", icon: Settings },
      { name: "Help & Support", path: "/support", icon: HelpCircle },
    ],
  },
];

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
}

export const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, orgName, orgLogoUrl } = useSidebar();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

          setProfile({
            id: user.id,
            email: user.email || null,
            fullName: profileData?.full_name || user.user_metadata?.full_name || null,
            role: profileData?.role || "Member",
          });
        }
      } catch (err) {
        console.error("Error fetching user profile in sidebar:", err);
      }
    }

    fetchUser();
  }, []);

  const isVisibleExpanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => {
    if (path === "/overview") {
      return pathname === "/overview";
    }
    if (path.startsWith("/settings")) {
      return pathname.startsWith("/settings");
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const getInitials = () => {
    if (profile?.fullName) {
      return profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return "BA";
  };

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out ${
        isMobileOpen
          ? "translate-x-0 w-[270px]"
          : "-translate-x-full lg:translate-x-0"
      } ${
        isVisibleExpanded ? "w-[270px]" : "w-[80px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 px-5">
        <Link href="/overview" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-xs">
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={orgLogoUrl} alt={orgName ?? "Organization logo"} className="h-full w-full object-cover" />
            ) : (
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
            )}
          </div>
          {isVisibleExpanded && (
            <div className="flex flex-col">
              <span className="truncate text-base font-bold tracking-tight text-slate-900">
                {orgName ?? "Workspace"}
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
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
              <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h3>
            ) : (
              <div className="my-2 border-t border-slate-100" />
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      data-tour={item.tourId}
                      title={!isVisibleExpanded ? item.name : undefined}
                      className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 rounded-r-lg"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      } ${!isVisibleExpanded ? "justify-center px-2 border-l-0 rounded-lg" : ""}`}
                    >
                      <IconComponent
                        strokeWidth={1.75}
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          active
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      {isVisibleExpanded && (
                        <span className="truncate">{item.name}</span>
                      )}
                      {isVisibleExpanded && active && (
                        <ChevronRight className="ml-auto h-4 w-4 text-blue-600 opacity-80" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom SaaS Trial & User Initials Avatar Widget */}
      <div className="border-t border-slate-200/80 p-3.5 space-y-3 mt-auto shrink-0 bg-white">
        {isVisibleExpanded ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                14-Day Free Trial
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Self-serve TMS edition with unlimited dispatch & rate cons.
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="14-Day Free Trial Active">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
        )}

        {/* Cleanly Stacked User Profile Link */}
        <Link
          href="/settings/organization"
          className={`flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors ${
            !isVisibleExpanded ? "justify-center" : ""
          }`}
          title={!isVisibleExpanded ? profile?.fullName || "User Profile" : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 text-xs font-bold text-white shadow-xs">
            {getInitials()}
          </div>
          {isVisibleExpanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {profile?.fullName || "Broker User"}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {profile?.email || "user@loadlinkers.com"}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
