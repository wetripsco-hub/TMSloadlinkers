"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { createClient } from "@/lib/supabase/client";
import { Dropdown, DropdownItem } from "@/components/ui/tailadmin/dropdown";
import {
  Menu,
  X,
  Search,
  LogOut,
  User as UserIcon,
  Shield,
  ShieldCheck,
  Layers,
  CreditCard,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
}

export const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar, orgName } = useSidebar();
  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Try to fetch profile details
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

          // Check if user is an authorized platform staff/admin
          try {
            const { data: isAdmin } = await supabase.rpc("is_platform_admin", {
              uid: user.id,
            });
            if (isAdmin) {
              setIsPlatformAdmin(true);
            }
          } catch {
            // Ignore RPC failure for normal users
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    }

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Initials for avatar fallback
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

  const initials = getInitials();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6">
      {/* Left: Sidebar toggles & search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop collapse/expand toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:flex transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search loads, carriers, docs..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right Action Icons & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Platform Admin Switcher for Authorized Staff */}
        {isPlatformAdmin && (
          <Link
            href="/platform-admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
            title="Platform Admin Console"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Platform Admin</span>
          </Link>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="dropdown-toggle flex items-center gap-2.5 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50 transition-colors max-w-[210px]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 text-xs font-bold text-white shadow-xs">
              {initials}
            </div>
            <div className="hidden text-left sm:block min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {profile?.fullName || "Broker Agent"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {orgName || "Workspace"}
              </p>
            </div>
          </button>

          <Dropdown
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            className="w-64"
          >
            {/* Header info */}
            <div className="border-b border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-800">
                {profile?.fullName || "Broker User"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {profile?.email || "user@loadlinkers.com"}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  <Shield className="h-3 w-3" />
                  {profile?.role || "Member"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Layers className="h-3 w-3" />
                  {orgName || "Workspace"}
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              {isPlatformAdmin && (
                <DropdownItem
                  tag="a"
                  href="/platform-admin"
                  onItemClick={() => setIsUserMenuOpen(false)}
                >
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Platform Admin
                </DropdownItem>
              )}
              <DropdownItem
                tag="a"
                href="/loads"
                onItemClick={() => setIsUserMenuOpen(false)}
              >
                <UserIcon className="h-4 w-4 text-slate-500" />
                Active Loads
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="/settings/billing"
                onItemClick={() => setIsUserMenuOpen(false)}
              >
                <CreditCard className="h-4 w-4 text-slate-500" />
                Billing
              </DropdownItem>
            </div>

            {/* Sign Out Button */}
            <div className="border-t border-slate-100 pt-1">
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
