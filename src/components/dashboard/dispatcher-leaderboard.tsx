"use client";

import React from "react";
import { formatMoney } from "@/lib/format";
import Image from "next/image";

export interface LeaderboardUser {
  id: string;
  name: string;
  role?: string;
  revenueCents: number;
  loadCount: number;
  avatarUrl?: string | null;
}

export interface DispatcherLeaderboardProps {
  dateRangeText: string;
  leaders: LeaderboardUser[];
}

export function DispatcherLeaderboard({
  dateRangeText,
  leaders = [],
}: DispatcherLeaderboardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Leaderboard
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          {dateRangeText}
        </span>
      </div>

      {/* Body: List or Empty State */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {leaders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No matching records
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leaders.map((leader, index) => {
              const initials = leader.name
                ? leader.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "DP";

              return (
                <li
                  key={leader.id}
                  className="flex items-center justify-between py-2.5 text-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-semibold text-slate-500 w-3.5">
                      {index + 1}.
                    </span>

                    {/* Avatar or Initials */}
                    {leader.avatarUrl ? (
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200">
                        <Image
                          src={leader.avatarUrl}
                          alt={leader.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {initials}
                      </div>
                    )}

                    <span className="truncate font-semibold text-slate-800">
                      {leader.name}
                    </span>
                  </div>

                  <span className="font-semibold text-slate-900 font-mono text-sm shrink-0">
                    {formatMoney(leader.revenueCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DispatcherLeaderboard;
