import { PageHeader } from "@/components/layout/page-header";
import { LoadWizard } from "@/components/loads/load-wizard";

export default function NewLoadPage() {
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
        <LoadWizard />
      </div>
    </div>
  );
}
