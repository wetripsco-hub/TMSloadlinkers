"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { createClient } from "@/lib/supabase/client";
import { Dropdown, DropdownItem } from "@/components/ui/tailadmin/dropdown";
import {
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { seedDemoDataAction } from "@/app/(dashboard)/loads/actions";

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  orgName?: string | null;
}

export const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

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
            .select("id, full_name, email, role, org_id")
            .eq("id", user.id)
            .maybeSingle();

          let orgName = "Freight Tenant";
          if (profileData?.org_id) {
            const { data: orgData } = await supabase
              .from("organizations")
              .select("name")
              .eq("id", profileData.org_id)
              .maybeSingle();
            if (orgData?.name) {
              orgName = orgData.name;
            }
          }

          setProfile({
            id: user.id,
            email: user.email ?? profileData?.email ?? null,
            fullName: profileData?.full_name ?? user.email?.split("@")[0] ?? "Dispatcher",
            role: profileData?.role ?? "Broker",
            orgName,
          });
        }
      } catch (err) {
        console.error("Error loading user profile in header:", err);
      }
    }

    fetchUser();
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error signing out:", err);
      setIsSigningOut(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      await seedDemoDataAction();
      router.refresh();
    } catch (err) {
      console.error("Error seeding demo data:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TL";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-[#18171d]/95 sm:px-6">
      {/* Left side: Toggle button and Search */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors lg:hidden"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Global Search Input */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search loads, carriers, bills..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-10 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-hidden dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:focus:border-brand-500"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Sample Data Seed Trigger in Header */}
        <button
          type="button"
          onClick={handleSeedDemoData}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/80 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-all shadow-xs"
          title="Inject sample shippers, carriers, loads & invoices"
        >
          <Sparkles className={`h-3.5 w-3.5 text-brand-500 ${isSeeding ? "animate-spin" : ""}`} />
          <span className="hidden xs:inline">{isSeeding ? "Loading..." : "Load Sample Data"}</span>
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="dropdown-toggle flex items-center gap-2.5 rounded-xl border border-gray-200 px-2 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 transition-colors max-w-[210px]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
              {initials}
            </div>
            <div className="hidden text-left sm:block min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {profile?.fullName || "Broker Agent"}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {profile?.orgName || "Enterprise"}
              </p>
            </div>
          </button>

          <Dropdown
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            className="w-64"
          >
            {/* Header info */}
            <div className="border-b border-gray-100 p-3 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {profile?.fullName || "Broker User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile?.email || "user@loadlinkers.com"}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  <Shield className="h-3 w-3" />
                  {profile?.role || "Member"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <Layers className="h-3 w-3" />
                  {profile?.orgName || "Default Org"}
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              <DropdownItem
                tag="a"
                href="/loads"
                onItemClick={() => setIsUserMenuOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                Active Loads
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="/invoices"
                onItemClick={() => setIsUserMenuOpen(false)}
              >
                <Layers className="h-4 w-4" />
                Billing & Invoices
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleSeedDemoData();
                }}
              >
                <Sparkles className="h-4 w-4 text-brand-500" />
                Load Sample Data
              </DropdownItem>
            </div>

            {/* Sign Out Button */}
            <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
              <DropdownItem
                onClick={handleSignOut}
                destructive
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
