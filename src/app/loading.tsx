import { LoadlinkersLogo } from "@/components/icons";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white">
      <LoadlinkersLogo className="h-7 w-auto max-w-[170px] animate-pulse" />
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        Loading your workspace...
      </div>
    </div>
  );
}
