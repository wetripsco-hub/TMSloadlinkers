import Link from "next/link";
import { ArrowRight, Building2, Package, Truck } from "lucide-react";

const STEPS = [
  {
    title: "Add a customer",
    description: "Create the shipper you're moving freight for.",
    href: "/customers",
    icon: Building2,
  },
  {
    title: "Add a carrier",
    description: "Bring on the carrier that will haul the load.",
    href: "/carriers",
    icon: Truck,
  },
  {
    title: "Create your first load",
    description: "Book a load and start tracking it end to end.",
    href: "/loads",
    icon: Package,
  },
];

export function EmptyStateChecklist() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60 sm:p-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Welcome to your workspace</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Your dashboard fills in once you have loads moving. Get started with these three steps.
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title}>
              <Link
                href={step.href}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:hover:border-brand-700 dark:hover:bg-brand-500/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {index + 1}
                </span>
                <Icon className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-brand-500" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{step.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
