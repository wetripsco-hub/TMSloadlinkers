import type { Metadata } from "next";
import { listCustomers } from "@/lib/repositories/customers";
import { listLoads } from "@/lib/repositories/loads";
import { CustomerTable } from "@/components/customers/customer-table";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { formatMoney } from "@/lib/format";
import { Building2, Users, Package, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customers & Shippers | FreightLink TMS",
};

export default async function CustomersPage() {
  const [customersResult, loadsResult] = await Promise.all([
    listCustomers({}, { page: 1, pageSize: 100 }),
    listLoads({}, { page: 1, pageSize: 150 }),
  ]);

  const customers = customersResult.data;
  const loads = loadsResult.data;

  // Calculate active loads per customer and pipeline volume
  const activeLoadsCountByCustomer: Record<string, number> = {};
  let totalContractedVolumeCents = 0;
  let activeShippersCount = 0;

  loads.forEach((load) => {
    totalContractedVolumeCents += load.shipperRate || 0;

    if (
      load.customerId &&
      load.status !== "delivered" &&
      load.status !== "pod_uploaded" &&
      load.status !== "invoiced" &&
      load.status !== "settled" &&
      load.status !== "cancelled"
    ) {
      activeLoadsCountByCustomer[load.customerId] =
        (activeLoadsCountByCustomer[load.customerId] || 0) + 1;
    }
  });

  customers.forEach((c) => {
    if ((activeLoadsCountByCustomer[c.id] || 0) > 0) {
      activeShippersCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Action */}
      <PageHeader
        title="Shipper & Customer Accounts"
        subtitle="Manage commercial billing relationships, active loads, and contracted freight volume."
        breadcrumbs={[
          { label: "Directory", href: "/customers" },
          { label: "Customers", href: "/customers" },
        ]}
        action={<AddCustomerModal />}
      />

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={customers.length}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          badgeText="Shippers"
          badgeColor="primary"
          subtitle="Registered business accounts"
          variant="plausible"
        />

        <MetricCard
          title="Active Shippers"
          value={activeShippersCount}
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          badgeText={activeShippersCount > 0 ? "Dispatch Active" : "No Active"}
          badgeColor="success"
          subtitle="Shippers with live running loads"
          variant="plausible"
        />

        <MetricCard
          title="Total Booked Loads"
          value={loads.length}
          icon={<Package className="h-5 w-5 text-sky-600" />}
          badgeText="All Time"
          badgeColor="info"
          subtitle="Total shipment orders placed"
          variant="plausible"
        />

        <MetricCard
          title="Contracted Volume"
          value={formatMoney(totalContractedVolumeCents)}
          icon={<DollarSign className="h-5 w-5 text-amber-600" />}
          badgeText="Gross Freight"
          badgeColor="warning"
          subtitle="Cumulative contracted shipper revenue"
          variant="plausible"
        />
      </div>

      {/* Main Customers Table */}
      <CustomerTable
        customers={customers}
        activeLoadsCountByCustomer={activeLoadsCountByCustomer}
      />
    </div>
  );
}
