import { listCustomers } from "@/lib/repositories/customers";
import { listLoads } from "@/lib/repositories/loads";
import { CustomerTable } from "@/components/customers/customer-table";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { Building2, Users, Package, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

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
      {/* Breadcrumb Header with Action */}
      <PageBreadcrumb pageTitle="Shipper Accounts">
        <AddCustomerModal />
      </PageBreadcrumb>

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={customers.length}
          icon={<Building2 className="h-6 w-6 text-brand-500" />}
          badgeText="Shippers"
          badgeColor="primary"
          subtitle="Registered business accounts"
        />

        <MetricCard
          title="Active Shippers"
          value={activeShippersCount}
          icon={<Users className="h-6 w-6 text-emerald-500" />}
          badgeText={activeShippersCount > 0 ? "Dispatch Active" : "No Active"}
          badgeColor="success"
          subtitle="Shippers with live running loads"
        />

        <MetricCard
          title="Total Booked Loads"
          value={loads.length}
          icon={<Package className="h-6 w-6 text-sky-500" />}
          badgeText="All Time"
          badgeColor="info"
          subtitle="Total shipment orders placed"
        />

        <MetricCard
          title="Contracted Volume"
          value={`$${(totalContractedVolumeCents / 100).toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          icon={<DollarSign className="h-6 w-6 text-amber-500" />}
          badgeText="Gross Freight"
          badgeColor="warning"
          subtitle="Cumulative contracted shipper revenue"
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
