import type { Metadata } from "next";
import { listFacilities } from "@/lib/repositories/facilities";
import { listCustomers } from "@/lib/repositories/customers";
import { FacilityTable } from "@/components/facilities/facility-table";
import { FacilityFormDialog } from "@/components/facilities/facility-form-dialog";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Facilities | FreightLink TMS",
};

export default async function FacilitiesPage() {
  const [facilities, customersResult] = await Promise.all([
    listFacilities(),
    listCustomers({}, { page: 1, pageSize: 100 }),
  ]);

  const customers = customersResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        subtitle="Saved shipping and receiving docks -- reusable when creating loads."
        breadcrumbs={[
          { label: "Directory", href: "/facilities" },
          { label: "Facilities", href: "/facilities" },
        ]}
        action={<FacilityFormDialog customers={customers} />}
      />

      <FacilityTable facilities={facilities} customers={customers} />
    </div>
  );
}
