"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getVisibleFinancialFields, type FinancialFieldKey } from "@/lib/domain/workspace";
import type { WorkspaceType } from "../../types/domain";

export interface WorkspaceMode {
  workspaceType: WorkspaceType | null;
  isBroker: boolean;
  isDispatcher: boolean;
  isHybrid: boolean;
  visibleFinancialFields: FinancialFieldKey[];
  isLoading: boolean;
  error: string | null;
}

const EMPTY_MODE: Omit<WorkspaceMode, "isLoading" | "error"> = {
  workspaceType: null,
  isBroker: false,
  isDispatcher: false,
  isHybrid: false,
  visibleFinancialFields: [],
};

function deriveMode(workspaceType: WorkspaceType): Omit<WorkspaceMode, "isLoading" | "error"> {
  return {
    workspaceType,
    isBroker: workspaceType === "freight_brokerage",
    isDispatcher: workspaceType === "truck_dispatch",
    isHybrid: workspaceType === "hybrid_enterprise",
    visibleFinancialFields: getVisibleFinancialFields(workspaceType),
  };
}

export function useWorkspaceMode(): WorkspaceMode {
  const [mode, setMode] = useState<Omit<WorkspaceMode, "isLoading" | "error">>(EMPTY_MODE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setMode(EMPTY_MODE);
          setError("Not authenticated");
          setIsLoading(false);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        if (!cancelled) {
          setMode(EMPTY_MODE);
          setError(profileError?.message ?? "No organization assigned to this profile");
          setIsLoading(false);
        }
        return;
      }

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("workspace_type")
        .eq("id", profile.org_id)
        .single();

      if (cancelled) {
        return;
      }

      if (orgError || !organization) {
        setMode(EMPTY_MODE);
        setError(orgError?.message ?? "Organization not found");
        setIsLoading(false);
        return;
      }

      setMode(deriveMode(organization.workspace_type as WorkspaceType));
      setError(null);
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...mode, isLoading, error };
}
