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
    <div className="rounded-md border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900">Welcome to your workspace</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your dashboard fills in once you have loads moving. Get started with these three steps.
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title}>
              <Link
                href={step.href}
                className="group flex items-center gap-4 rounded-md border border-slate-200/80 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/20 shadow-2xs"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                  {index + 1}
                </span>
                <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {step.title}
                  </span>
                  <span className="block text-xs text-slate-500">{step.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
