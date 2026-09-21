"use server";

import {
  respondAsShipper,
  type RespondToQuoteAsShipperAction,
} from "@/lib/repositories/quotes";
import type { Cents, Quote } from "../../../../types/domain";

// No auth/org check here by design -- this route is public, same as
// app/track/[token]/actions.ts. Isolation is enforced inside
// respondAsShipper, which resolves the quote strictly from the token
// argument via the respond_to_quote_as_shipper SECURITY DEFINER RPC.
export async function submitQuoteResponseAction(
  token: string,
  action: RespondToQuoteAsShipperAction,
  counterRate: Cents | null,
  note: string | null
): Promise<Quote> {
  if (action === "counter" && (counterRate === null || counterRate <= 0)) {
    throw new Error("Counter rate must be greater than zero");
  }

  return respondAsShipper(token, action, counterRate, note);
}
