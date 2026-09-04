import { createClient } from "@/lib/supabase/server";
import { ensureUserOrganization } from "@/lib/services/ensure-user-organization";
import type { UUID } from "../../../types/domain";
import type { TablesInsert } from "../../../types/database";

export async function seedDemoDataForCurrentOrg(): Promise<{
  customersCount: number;
  carriersCount: number;
  loadsCount: number;
  invoicesCount: number;
}> {
  const supabase = await createClient();

  // 1. Resolve org_id safely via ensureUserOrganization
  const orgId = await ensureUserOrganization(supabase);

  if (!orgId) {
    throw new Error("Unable to resolve or initialize organization. Please refresh or sign up.");
  }

  // 2. Insert 3 Realistic Shippers / Customers
  const customerRecords = [
    {
      org_id: orgId,
      name: "Apex Logistics Group",
      email: "dispatch@apexlogistics.com",
      phone: "(312) 555-0192",
      billing_address: "233 S Wacker Dr, Suite 4800, Chicago, IL 60606",
    },
    {
      org_id: orgId,
      name: "Metro Distribution Services",
      email: "logistics@metrodist.com",
      phone: "(214) 555-4710",
      billing_address: "1700 Pacific Ave, Dallas, TX 75201",
    },
    {
      org_id: orgId,
      name: "Swift Cold Chain Logistics",
      email: "ap@swiftcoldchain.com",
      phone: "(404) 555-8321",
      billing_address: "1000 Peachtree St NE, Atlanta, GA 30309",
    },
  ];

  const { data: insertedCustomers, error: custError } = await supabase
    .from("customers")
    .insert(customerRecords)
    .select("id, name");

  if (custError) {
    throw new Error(`Failed to seed customers: ${custError.message}`);
  }

  const c1 = insertedCustomers[0]?.id;
  const c2 = insertedCustomers[1]?.id;
  const c3 = insertedCustomers[2]?.id;

  // 3. Insert 4 Realistic Carriers with valid MC/DOT numbers
  const carrierRecords = [
    {
      org_id: orgId,
      name: "Express Freight Lines LLC",
      mc_number: "982144",
      dot_number: "3124890",
      contact_email: "dispatch@expressfreight.com",
      contact_phone: "(615) 555-3200",
    },
    {
      org_id: orgId,
      name: "Reliable Haulers Inc",
      mc_number: "741258",
      dot_number: "2891450",
      contact_email: "operations@reliablehaulers.com",
      contact_phone: "(817) 555-9411",
    },
    {
      org_id: orgId,
      name: "Patriot Transport Systems",
      mc_number: "852369",
      dot_number: "3412099",
      contact_email: "loads@patriottransport.com",
      contact_phone: "(404) 555-1288",
    },
    {
      org_id: orgId,
      name: "Horizon Star Logistics",
      mc_number: "632190",
      dot_number: "2509188",
      contact_email: "dispatch@horizonstar.com",
      contact_phone: "(303) 555-6672",
    },
  ];

  const { data: insertedCarriers, error: carrError } = await supabase
    .from("carriers")
    .insert(carrierRecords)
    .select("id, name");

  if (carrError) {
    throw new Error(`Failed to seed carriers: ${carrError.message}`);
  }

  const k1 = insertedCarriers[0]?.id;
  const k2 = insertedCarriers[1]?.id;
  const k3 = insertedCarriers[2]?.id;
  const k4 = insertedCarriers[3]?.id;

  // 4. Insert 9-10 Loads across diverse lifecycle stages & financial margins
  const now = new Date();
  const dMinus2 = new Date(now.getTime() - 2 * 86400000).toISOString();
  const dMinus1 = new Date(now.getTime() - 1 * 86400000).toISOString();
  const dPlus1 = new Date(now.getTime() + 1 * 86400000).toISOString();
  const dPlus2 = new Date(now.getTime() + 2 * 86400000).toISOString();
  const dPlus3 = new Date(now.getTime() + 3 * 86400000).toISOString();

  const loadRecords: TablesInsert<"loads">[] = [
    {
      org_id: orgId,
      customer_id: c1,
      carrier_id: k1,
      status: "in_transit",
      origin: "Chicago, IL",
      destination: "Atlanta, GA",
      pickup_date: dMinus1,
      delivery_date: dPlus1,
      shipper_rate: 2850.0,
      carrier_pay: 2200.0,
      driver_name: "Marcus Vance",
      driver_phone: "(312) 555-9011",
      truck_number: "TRK-801",
      trailer_number: "VN-5301",
      last_known_lat: 36.1627,
      last_known_lng: -86.7816,
      last_ping_at: new Date().toISOString(),
    },
    {
      org_id: orgId,
      customer_id: c2,
      carrier_id: k2,
      status: "dispatched",
      origin: "Dallas, TX",
      destination: "Phoenix, AZ",
      pickup_date: now.toISOString(),
      delivery_date: dPlus2,
      shipper_rate: 3600.0,
      carrier_pay: 2900.0,
      driver_name: "Alejandro Gomez",
      driver_phone: "(214) 555-4420",
      truck_number: "TRK-442",
      trailer_number: "RF-5390",
    },
    {
      org_id: orgId,
      customer_id: c3,
      carrier_id: k3,
      status: "delivered",
      origin: "Los Angeles, CA",
      destination: "Denver, CO",
      pickup_date: dMinus2,
      delivery_date: dMinus1,
      shipper_rate: 4200.0,
      carrier_pay: 3400.0,
      driver_name: "David Miller",
      driver_phone: "(303) 555-8812",
      truck_number: "TRK-109",
      trailer_number: "VN-5388",
    },
    {
      org_id: orgId,
      customer_id: c1,
      carrier_id: k4,
      status: "covered",
      origin: "Memphis, TN",
      destination: "Columbus, OH",
      pickup_date: dPlus1,
      delivery_date: dPlus2,
      shipper_rate: 2100.0,
      carrier_pay: 1650.0,
    },
    {
      org_id: orgId,
      customer_id: c2,
      carrier_id: k1,
      status: "pod_uploaded",
      origin: "Savannah, GA",
      destination: "Charlotte, NC",
      pickup_date: dMinus2,
      delivery_date: dMinus1,
      shipper_rate: 1950.0,
      carrier_pay: 1500.0,
    },
    {
      org_id: orgId,
      customer_id: c3,
      carrier_id: null,
      status: "quoted",
      origin: "Houston, TX",
      destination: "Nashville, TN",
      pickup_date: dPlus2,
      delivery_date: dPlus3,
      shipper_rate: 3100.0,
      carrier_pay: 2450.0,
    },
    {
      org_id: orgId,
      customer_id: c1,
      carrier_id: k3,
      status: "invoiced",
      origin: "Indianapolis, IN",
      destination: "Allentown, PA",
      pickup_date: dMinus2,
      delivery_date: dMinus1,
      shipper_rate: 2700.0,
      carrier_pay: 2100.0,
    },
    {
      org_id: orgId,
      customer_id: c2,
      carrier_id: k4,
      status: "settled",
      origin: "Kansas City, MO",
      destination: "Salt Lake City, UT",
      pickup_date: dMinus2,
      delivery_date: dMinus1,
      shipper_rate: 4500.0,
      carrier_pay: 3700.0,
    },
    {
      org_id: orgId,
      customer_id: c3,
      carrier_id: k1,
      status: "at_pickup",
      origin: "Seattle, WA",
      destination: "Oakland, CA",
      pickup_date: now.toISOString(),
      delivery_date: dPlus2,
      shipper_rate: 2600.0,
      carrier_pay: 2050.0,
    },
  ];

  const { data: insertedLoads, error: loadsError } = await supabase
    .from("loads")
    .insert(loadRecords)
    .select("id, status, customer_id, carrier_id, shipper_rate, carrier_pay");

  if (loadsError) {
    throw new Error(`Failed to seed loads: ${loadsError.message}`);
  }

  // 5. Insert Sample Invoices & Settlements matching delivered/settled loads
  const deliveredLoad = insertedLoads?.find((l) => l.status === "delivered");
  const invoicedLoad = insertedLoads?.find((l) => l.status === "invoiced");
  const settledLoad = insertedLoads?.find((l) => l.status === "settled");

  const invoiceRecords: TablesInsert<"invoices">[] = [];

  if (deliveredLoad) {
    invoiceRecords.push({
      org_id: orgId,
      load_id: deliveredLoad.id,
      customer_id: deliveredLoad.customer_id,
      carrier_id: null,
      invoice_type: "shipper_invoice",
      payment_status: "paid",
      amount_total: deliveredLoad.shipper_rate,
      amount_paid: deliveredLoad.shipper_rate,
      due_date: new Date(now.getTime() + 15 * 86400000).toISOString().split("T")[0],
    });
  }

  if (invoicedLoad) {
    invoiceRecords.push({
      org_id: orgId,
      load_id: invoicedLoad.id,
      customer_id: invoicedLoad.customer_id,
      carrier_id: null,
      invoice_type: "shipper_invoice",
      payment_status: "pending",
      amount_total: invoicedLoad.shipper_rate,
      amount_paid: 0,
      due_date: new Date(now.getTime() + 25 * 86400000).toISOString().split("T")[0],
    });
  }

  if (settledLoad) {
    invoiceRecords.push({
      org_id: orgId,
      load_id: settledLoad.id,
      customer_id: null,
      carrier_id: settledLoad.carrier_id,
      invoice_type: "carrier_settlement",
      payment_status: "paid",
      amount_total: settledLoad.carrier_pay,
      amount_paid: settledLoad.carrier_pay,
      due_date: new Date(now.getTime() - 3 * 86400000).toISOString().split("T")[0],
    });
  }

  if (invoiceRecords.length > 0) {
    const { error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceRecords);

    if (invoiceError) {
      console.warn("Non-critical invoice seed notice:", invoiceError.message);
    }
  }

  return {
    customersCount: insertedCustomers.length,
    carriersCount: insertedCarriers.length,
    loadsCount: insertedLoads.length,
    invoicesCount: invoiceRecords.length,
  };
}
