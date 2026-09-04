// Seeds a local/dev-only demo login (auth user + org + profile + sample
// operational data) so a fresh checkout has something to look at without
// manual signup. Uses the Supabase service role key, so it must never run
// against a real production project.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const DEMO_FULL_NAME = "Demo Admin";
const ORG_NAME = "LoadLinkers Logistics";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
}

interface SeedCustomer {
  name: string;
  email: string;
  phone: string;
}

interface SeedCarrier {
  name: string;
  mcNumber: string;
  dotNumber: string;
  contactEmail: string;
  contactPhone: string;
}

interface SeedLoad {
  origin: string;
  destination: string;
  status: string;
  shipperRate: number;
  carrierPay: number;
  pickupOffsetDays: number;
  deliveryOffsetDays: number;
  customerIndex: number;
  carrierIndex: number | null;
}

const SEED_CUSTOMERS: SeedCustomer[] = [
  { name: "Meridian Foods Co.", email: "ap@meridianfoods.example", phone: "312-555-0142" },
  { name: "Atlas Building Supply", email: "billing@atlasbuilding.example", phone: "469-555-0187" },
  { name: "Coastal Retail Group", email: "accounts@coastalretail.example", phone: "904-555-0119" },
];

const SEED_CARRIERS: SeedCarrier[] = [
  {
    name: "Blue Horizon Trucking",
    mcNumber: "MC-482913",
    dotNumber: "DOT-2201457",
    contactEmail: "dispatch@bluehorizon.example",
    contactPhone: "817-555-0163",
  },
  {
    name: "Ironclad Freight LLC",
    mcNumber: "MC-519204",
    dotNumber: "DOT-2298031",
    contactEmail: "ops@ironcladfreight.example",
    contactPhone: "614-555-0128",
  },
  {
    name: "Prairie Line Logistics",
    mcNumber: "MC-663810",
    dotNumber: "DOT-2410552",
    contactEmail: "dispatch@prairieline.example",
    contactPhone: "402-555-0174",
  },
  {
    name: "Summit Carriers Inc.",
    mcNumber: "MC-728145",
    dotNumber: "DOT-2517699",
    contactEmail: "dispatch@summitcarriers.example",
    contactPhone: "303-555-0196",
  },
];

// Statuses span the full lifecycle so every dashboard view (loads, invoices,
// settlements) has something to show. carrierIndex is null while a load has
// no carrier engaged yet (quoted / posted_to_boards).
const SEED_LOADS: SeedLoad[] = [
  { origin: "Chicago, IL", destination: "Dallas, TX", status: "delivered", shipperRate: 3200, carrierPay: 2450, pickupOffsetDays: -9, deliveryOffsetDays: -7, customerIndex: 0, carrierIndex: 0 },
  { origin: "Atlanta, GA", destination: "Miami, FL", status: "pod_uploaded", shipperRate: 1850, carrierPay: 1400, pickupOffsetDays: -6, deliveryOffsetDays: -5, customerIndex: 1, carrierIndex: 1 },
  { origin: "Los Angeles, CA", destination: "Phoenix, AZ", status: "invoiced", shipperRate: 1200, carrierPay: 900, pickupOffsetDays: -14, deliveryOffsetDays: -13, customerIndex: 2, carrierIndex: 2 },
  { origin: "Seattle, WA", destination: "Portland, OR", status: "settled", shipperRate: 650, carrierPay: 480, pickupOffsetDays: -21, deliveryOffsetDays: -20, customerIndex: 0, carrierIndex: 3 },
  { origin: "Denver, CO", destination: "Kansas City, MO", status: "in_transit", shipperRate: 2100, carrierPay: 1600, pickupOffsetDays: -1, deliveryOffsetDays: 1, customerIndex: 1, carrierIndex: 0 },
  { origin: "Houston, TX", destination: "New Orleans, LA", status: "dispatched", shipperRate: 1450, carrierPay: 1100, pickupOffsetDays: 1, deliveryOffsetDays: 2, customerIndex: 2, carrierIndex: 1 },
  { origin: "Columbus, OH", destination: "Pittsburgh, PA", status: "covered", shipperRate: 980, carrierPay: 730, pickupOffsetDays: 3, deliveryOffsetDays: 4, customerIndex: 0, carrierIndex: 2 },
  { origin: "Charlotte, NC", destination: "Richmond, VA", status: "posted_to_boards", shipperRate: 1100, carrierPay: 820, pickupOffsetDays: 5, deliveryOffsetDays: 6, customerIndex: 1, carrierIndex: null },
  { origin: "Nashville, TN", destination: "Memphis, TN", status: "quoted", shipperRate: 890, carrierPay: 650, pickupOffsetDays: 7, deliveryOffsetDays: 8, customerIndex: 2, carrierIndex: null },
  { origin: "Jacksonville, FL", destination: "Savannah, GA", status: "cancelled", shipperRate: 720, carrierPay: 540, pickupOffsetDays: -3, deliveryOffsetDays: -2, customerIndex: 0, carrierIndex: 3 },
];

function daysFromNow(offset: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString();
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const DEMO_EMAIL = process.env.DEMO_USER_EMAIL;
  const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Get it from Supabase " +
        "Dashboard -> Project Settings -> API -> service_role secret, and add " +
        "it to .env.local. Never commit this key or use it in the browser."
    );
  }
  if (!DEMO_EMAIL || !DEMO_PASSWORD) {
    throw new Error(
      "Missing DEMO_USER_EMAIL and/or DEMO_USER_PASSWORD in .env.local. Set " +
        "both to define the demo login this script creates."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // a) demo auth user
  console.log(`Checking for existing user ${DEMO_EMAIL}...`);
  let user = await findUserByEmail(supabase, DEMO_EMAIL);

  if (!user) {
    console.log("Creating demo auth user...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_FULL_NAME },
    });
    if (error) throw error;
    user = data.user;
  } else {
    console.log("Demo user already exists, reusing it.");
  }

  if (!user) {
    throw new Error("Failed to create or find the demo user");
  }

  // b) demo organization
  console.log(`Ensuring organization "${ORG_NAME}" exists...`);
  const { data: existingOrg, error: orgLookupError } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", ORG_NAME)
    .maybeSingle();

  if (orgLookupError) throw orgLookupError;

  let orgId = existingOrg?.id as string | undefined;

  if (!orgId) {
    console.log("Creating organization...");
    const { data: newOrg, error: orgInsertError } = await supabase
      .from("organizations")
      .insert({ name: ORG_NAME, workspace_type: "freight_brokerage" })
      .select("id")
      .single();

    if (orgInsertError) throw orgInsertError;
    orgId = newOrg.id as string;
  }

  // c) profile upsert
  console.log("Upserting demo profile...");
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: DEMO_EMAIL,
        full_name: DEMO_FULL_NAME,
        role: "admin",
        org_id: orgId,
      },
      { onConflict: "id" }
    );

  if (profileError) throw profileError;

  // d) sample data, only if this org has no loads yet
  const { count: loadCount, error: loadCountError } = await supabase
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (loadCountError) throw loadCountError;

  if (loadCount && loadCount > 0) {
    console.log(`Organization already has ${loadCount} load(s); skipping sample data.`);
  } else {
    console.log("Seeding sample customers, carriers, and loads...");

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .insert(
        SEED_CUSTOMERS.map((c) => ({
          org_id: orgId,
          name: c.name,
          email: c.email,
          phone: c.phone,
        }))
      )
      .select("id");

    if (customersError) throw customersError;

    const { data: carriers, error: carriersError } = await supabase
      .from("carriers")
      .insert(
        SEED_CARRIERS.map((c) => ({
          org_id: orgId,
          name: c.name,
          mc_number: c.mcNumber,
          dot_number: c.dotNumber,
          contact_email: c.contactEmail,
          contact_phone: c.contactPhone,
        }))
      )
      .select("id");

    if (carriersError) throw carriersError;

    const { error: loadsError } = await supabase.from("loads").insert(
      SEED_LOADS.map((load) => ({
        org_id: orgId,
        customer_id: customers[load.customerIndex].id,
        carrier_id: load.carrierIndex !== null ? carriers[load.carrierIndex].id : null,
        status: load.status,
        origin: load.origin,
        destination: load.destination,
        pickup_date: daysFromNow(load.pickupOffsetDays),
        delivery_date: daysFromNow(load.deliveryOffsetDays),
        shipper_rate: load.shipperRate,
        carrier_pay: load.carrierPay,
      }))
    );

    if (loadsError) throw loadsError;

    console.log(
      `Seeded ${customers.length} customers, ${carriers.length} carriers, ${SEED_LOADS.length} loads.`
    );
  }

  console.log("\nDemo login ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  User ID:  ${user.id}`);
  console.log(`  Org ID:   ${orgId}`);
}

main().catch((error) => {
  console.error("\nSeed script failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
