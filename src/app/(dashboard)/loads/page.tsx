import { listLoads } from "@/lib/repositories/loads";
import { LoadsView } from "@/components/loads/loads-view";

export default async function LoadsPage() {
  const { data: loads } = await listLoads({}, { page: 1, pageSize: 50 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <LoadsView loads={loads} />
    </div>
  );
}
