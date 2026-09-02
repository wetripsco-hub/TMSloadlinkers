import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

// The `carriers` table only persists contact/identification fields today —
// compliance data (safety rating, insurance, blacklist status) from the
// full Carrier domain interface has no backing column yet, so this returns
// a narrower summary rather than fabricating those fields.
export interface CarrierSummary {
  id: UUID;
  name: string;
  mcNumber: string | null;
  dotNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface CarrierRow {
  id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

function mapRowToCarrierSummary(row: CarrierRow): CarrierSummary {
  return {
    id: row.id,
    name: row.name,
    mcNumber: row.mc_number,
    dotNumber: row.dot_number,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
  };
}

export async function getCarrierById(id: UUID): Promise<CarrierSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .select("id, name, mc_number, dot_number, contact_email, contact_phone")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToCarrierSummary(data as unknown as CarrierRow);
}
