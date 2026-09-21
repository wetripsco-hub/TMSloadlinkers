import { PageHeader } from "@/components/layout/page-header";
import { LoadWizard } from "@/components/loads/load-wizard";
import { listFacilities } from "@/lib/repositories/facilities";

export const dynamic = "force-dynamic";

export default async function NewLoadPage() {
  const facilities = await listFacilities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Freight Load"
        subtitle="Step-by-step wizard to configure routing, equipment, financial terms, and dispatch schedule."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Loads", href: "/loads" },
          { label: "New Load" },
        ]}
      />
      <div className="flex justify-center pb-8">
        <LoadWizard facilities={facilities} />
      </div>
    </div>
  );
}
