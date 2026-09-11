"use client";

import { APP_MODULES } from "@/lib/domain/modules";

export function ModuleAccessChecklist({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {APP_MODULES.map((module) => (
        <label
          key={module.key}
          className={`flex items-center gap-2 text-sm text-slate-700 ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(module.key)}
            disabled={disabled}
            onChange={() => toggle(module.key)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          {module.label}
        </label>
      ))}
    </div>
  );
}
