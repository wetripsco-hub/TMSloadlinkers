import { createClient } from "@/lib/supabase/server";
import { parseCents, formatCents } from "@/lib/money";
import type {
  Cents,
  Quote,
  QuoteNegotiationAction,
  QuoteNegotiationActorType,
  QuoteNegotiationEvent,
  QuoteStatus,
  UUID,
} from "../../../types/domain";

// All status-changing writes go through the SECURITY DEFINER RPCs in
// supabase/migrations/059_offers_quotes_schema.sql
// (respond_to_quote_as_broker / respond_to_quote_as_shipper) -- there is no
// UPDATE RLS policy on quotes for clients, so a raw `.update()` here would
// silently affect 0 rows instead of erroring. createQuote below is the one
// exception: a plain RLS-scoped INSERT is how a quote is first created
// (status defaults to 'sent' at the DB level), and quote_negotiation_events
// is insert-only via those same RPCs (no client-INSERT policy either).

interface QuoteRow {
  id: string;
  org_id: string;
  load_id: string;
  proposed_rate: number;
  status: QuoteStatus;
  tracking_token: string;
  expires_at: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

const QUOTE_COLUMNS =
  "id, org_id, load_id, proposed_rate, status, tracking_token, expires_at, created_by_user_id, created_at, updated_at";

function moneyToCents(value: number): Cents {
  return parseCents(String(value));
}

function centsToMoney(cents: Cents): string {
  return formatCents(cents).replace(/[$,]/g, "");
}

function mapRowToQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    orgId: row.org_id,
    loadId: row.load_id,
    proposedRate: moneyToCents(row.proposed_rate),
    status: row.status,
    trackingToken: row.tracking_token,
    expiresAt: row.expires_at,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Same pattern as lib/repositories/loads.ts / documents.ts: org_id is never
// accepted as a parameter, only ever resolved server-side from the caller's
// own profile, so a caller can never target another tenant.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.org_id) {
    throw new Error("No organization found for current user profile");
  }

  return data.org_id;
}

export async function listQuotesForLoad(loadId: UUID): Promise<Quote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("load_id", loadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as unknown as QuoteRow[]).map(mapRowToQuote);
}

export async function getQuoteById(id: UUID): Promise<Quote | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToQuote(data as unknown as QuoteRow);
}

// Normal RLS-scoped INSERT (quotes_insert_staff_own_org): status defaults
// to 'sent' at the DB level, so it is never set explicitly here.
export async function createQuote(loadId: UUID, proposedRate: Cents): Promise<Quote> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      org_id: orgId,
      load_id: loadId,
      proposed_rate: Number(centsToMoney(proposedRate)),
      created_by_user_id: user.id,
    })
    .select(QUOTE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToQuote(data as unknown as QuoteRow);
}

export type RespondToQuoteAction = "accept" | "counter";

// Calls the respond_to_quote_as_broker RPC -- the only sanctioned way to
// change a quote's status as the broker side. The RPC itself re-derives
// org_id from auth.uid() and re-validates the quote is in a respondable
// state ('sent' or 'countered_by_shipper') and not expired, so none of that
// is duplicated client- or repository-side here.
export async function respondAsBroker(
  quoteId: UUID,
  action: RespondToQuoteAction,
  counterRate: Cents | null,
  note: string | null
): Promise<Quote> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("respond_to_quote_as_broker", {
    p_quote_id: quoteId,
    p_action: action,
    p_counter_rate: counterRate !== null ? Number(centsToMoney(counterRate)) : undefined,
    p_note: note ?? undefined,
  });

  if (error) {
    throw error;
  }

  return mapRowToQuote(data as unknown as QuoteRow);
}

interface QuoteNegotiationEventRow {
  id: string;
  org_id: string;
  quote_id: string;
  actor_type: QuoteNegotiationEvent["actorType"];
  actor_user_id: string | null;
  action: QuoteNegotiationEvent["action"];
  rate: number | null;
  note: string | null;
  created_at: string;
}

const QUOTE_NEGOTIATION_EVENT_COLUMNS =
  "id, org_id, quote_id, actor_type, actor_user_id, action, rate, note, created_at";

function mapRowToQuoteNegotiationEvent(row: QuoteNegotiationEventRow): QuoteNegotiationEvent {
  return {
    id: row.id,
    orgId: row.org_id,
    quoteId: row.quote_id,
    actorType: row.actor_type,
    actorUserId: row.actor_user_id,
    action: row.action,
    rate: row.rate === null ? null : moneyToCents(row.rate),
    note: row.note,
    createdAt: row.created_at,
  };
}

// Oldest first, for a chronological negotiation-history timeline.
export async function listNegotiationEventsForQuote(quoteId: UUID): Promise<QuoteNegotiationEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_negotiation_events")
    .select(QUOTE_NEGOTIATION_EVENT_COLUMNS)
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as QuoteNegotiationEventRow[]).map(mapRowToQuoteNegotiationEvent);
}

export interface QuoteNeedingResponse extends Quote {
  loadNumber: string | null;
}

interface QuoteNeedingResponseRow extends QuoteRow {
  loads: { load_number: string | null } | { load_number: string | null }[] | null;
}

// Org-wide list of quotes sitting in 'countered_by_shipper' -- the shipper
// has moved, and it's the broker's turn to respond. Same embedded-load-
// number, filter-server-side-by-status shape as
// listDocumentsForReview()/DocumentForReview (lib/repositories/documents.ts).
export async function listQuotesNeedingResponse(): Promise<QuoteNeedingResponse[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(`${QUOTE_COLUMNS}, loads(load_number)`)
    .eq("status", "countered_by_shipper")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as unknown as QuoteNeedingResponseRow[]).map((row) => {
    const loadsField = row.loads;
    const loadNumber = Array.isArray(loadsField)
      ? (loadsField[0]?.load_number ?? null)
      : (loadsField?.load_number ?? null);

    return { ...mapRowToQuote(row), loadNumber };
  });
}

export interface QuoteListItem extends Quote {
  loadNumber: string | null;
  lastEvent: QuoteNegotiationEvent | null;
}

// Every quote in the org, regardless of status, most-recent-activity first
// (updated_at, which both RPCs bump on every accept/decline/counter --
// see supabase/migrations/059_offers_quotes_schema.sql -- as well as at
// creation). Powers the dedicated /quotes page
// (app/(dashboard)/quotes/page.tsx); listQuotesNeedingResponse above is
// unchanged and still the narrower countered_by_shipper-only query, reused
// by that same page to identify which rows to pin to the top.
export async function listAllQuotesForOrg(): Promise<QuoteListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(`${QUOTE_COLUMNS}, loads(load_number)`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const quotes = (data as unknown as QuoteNeedingResponseRow[]).map((row) => {
    const loadsField = row.loads;
    const loadNumber = Array.isArray(loadsField)
      ? (loadsField[0]?.load_number ?? null)
      : (loadsField?.load_number ?? null);

    return { ...mapRowToQuote(row), loadNumber };
  });

  if (quotes.length === 0) {
    return [];
  }

  const { data: eventRows, error: eventsError } = await supabase
    .from("quote_negotiation_events")
    .select(QUOTE_NEGOTIATION_EVENT_COLUMNS)
    .in(
      "quote_id",
      quotes.map((q) => q.id)
    )
    .order("created_at", { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  // First row seen per quote_id is its latest, thanks to the created_at
  // desc ordering above -- same reduction shape as listMessageThreads()
  // (lib/repositories/load-notes.ts).
  const lastEventByQuoteId = new Map<UUID, QuoteNegotiationEvent>();
  for (const row of (eventRows as unknown as QuoteNegotiationEventRow[]) ?? []) {
    if (!lastEventByQuoteId.has(row.quote_id)) {
      lastEventByQuoteId.set(row.quote_id, mapRowToQuoteNegotiationEvent(row));
    }
  }

  return quotes.map((quote) => ({
    ...quote,
    lastEvent: lastEventByQuoteId.get(quote.id) ?? null,
  }));
}

// Same list as listAllQuotesForOrg, with rows currently sitting in
// countered_by_shipper pinned to the top -- the one sort the /quotes page
// (and its polling refresh) needs, kept here so the initial server render
// and every subsequent poll produce identically-ordered results instead of
// two copies of this comparator drifting.
export async function listSortedQuotesForOrg(): Promise<QuoteListItem[]> {
  const [quotes, needsResponseQuotes] = await Promise.all([
    listAllQuotesForOrg(),
    listQuotesNeedingResponse(),
  ]);

  const needsResponseIds = new Set(needsResponseQuotes.map((q) => q.id));
  return [...quotes].sort((a, b) => {
    const aPriority = needsResponseIds.has(a.id) ? 0 : 1;
    const bPriority = needsResponseIds.has(b.id) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    // Both already come back updated_at-desc from listAllQuotesForOrg;
    // re-sorting the full list here would just redo that work, so only
    // the needs-response/other partition boundary is enforced.
    return 0;
  });
}

// ---------------------------------------------------------------------
// Public, token-authenticated (app/quote/[token]) -- no login, no org
// session. Same pattern as getLoadByTrackingToken/recordTrackingPing
// (lib/repositories/tracking.ts): createClient() here is still the normal
// anon-key + cookies client, never a service-role client. Isolation comes
// entirely from the token argument, resolved inside each SECURITY DEFINER
// RPC -- there are no anon RLS policies on quotes/quote_negotiation_events
// at all, so an anon caller can only ever reach the one quote its token
// names.
// ---------------------------------------------------------------------

export interface PublicQuoteEvent {
  actorType: QuoteNegotiationActorType;
  action: QuoteNegotiationAction;
  rate: Cents | null;
  note: string | null;
  createdAt: string;
}

// Deliberately narrower than Quote + Load: only the fields
// get_quote_by_token's jsonb_build_object actually selects (see
// supabase/migrations/059_offers_quotes_schema.sql). No org_id, load_id,
// broker_margin, carrier_pay, or customer identity ever leaves the RPC, so
// there is nothing to over-fetch or accidentally forward here.
export interface PublicQuote {
  quoteId: UUID;
  status: QuoteStatus;
  proposedRate: Cents;
  expiresAt: string;
  loadNumber: string | null;
  equipmentType: string | null;
  commodity: string | null;
  weightLbs: number | null;
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  pickupDate: string | null;
  events: PublicQuoteEvent[];
}

interface GetQuoteByTokenResult {
  quoteId: string;
  status: QuoteStatus;
  proposedRate: number;
  expiresAt: string;
  loadNumber: string | null;
  equipmentType: string | null;
  commodity: string | null;
  weightLbs: number | null;
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  pickupDate: string | null;
  events: {
    actorType: QuoteNegotiationActorType;
    action: QuoteNegotiationAction;
    rate: number | null;
    note: string | null;
    createdAt: string;
  }[];
}

// get_quote_by_token raises ('Quote not found') when no quote matches the
// token -- left to propagate rather than caught into a null return, so the
// caller (app/quote/[token]/page.tsx) can tell "invalid link" apart from a
// genuine fetch error using the same try/catch shape either way.
export async function getQuoteByToken(token: string): Promise<PublicQuote> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_quote_by_token", { p_token: token });

  if (error) {
    throw error;
  }

  const result = data as unknown as GetQuoteByTokenResult;

  return {
    quoteId: result.quoteId,
    status: result.status,
    proposedRate: moneyToCents(result.proposedRate),
    expiresAt: result.expiresAt,
    loadNumber: result.loadNumber,
    equipmentType: result.equipmentType,
    commodity: result.commodity,
    weightLbs: result.weightLbs,
    originCity: result.originCity,
    originState: result.originState,
    destinationCity: result.destinationCity,
    destinationState: result.destinationState,
    pickupDate: result.pickupDate,
    events: result.events.map((event) => ({
      actorType: event.actorType,
      action: event.action,
      rate: event.rate === null ? null : moneyToCents(event.rate),
      note: event.note,
      createdAt: event.createdAt,
    })),
  };
}

export type RespondToQuoteAsShipperAction = "accept" | "decline" | "counter";

// Calls respond_to_quote_as_shipper -- the public counterpart to
// respondAsBroker above. The RPC re-validates the quote's status
// ('sent'/'countered_by_broker' only) and expiry itself (lazily flips a
// stale quote to 'expired' and rejects the attempt), so none of that is
// duplicated client- or repository-side here.
export async function respondAsShipper(
  token: string,
  action: RespondToQuoteAsShipperAction,
  counterRate: Cents | null,
  note: string | null
): Promise<Quote> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("respond_to_quote_as_shipper", {
    p_token: token,
    p_action: action,
    p_counter_rate: counterRate !== null ? Number(centsToMoney(counterRate)) : undefined,
    p_note: note ?? undefined,
  });

  if (error) {
    throw error;
  }

  return mapRowToQuote(data as unknown as QuoteRow);
}
