"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsTab {
  label: string;
  href: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  { label: "Organization", href: "/settings/organization" },
  { label: "Team & Dispatchers", href: "/settings/team" },
  { label: "Billing & Plan", href: "/settings/billing" },
  { label: "Danger Zone", href: "/settings/danger-zone" },
];

export function SettingsNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Settings navigation">
        {SETTINGS_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap py-3 px-1 text-sm transition-colors ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "border-b-2 border-transparent text-slate-600 hover:text-slate-900 font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default SettingsNavTabs;
