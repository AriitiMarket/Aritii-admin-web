import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function DispatchBatchesPage() {
  return (
    <div>
      <PageHeader title="Dispatch / Batches" description="Manage dispatch / batches" />
      <Card>
        <p className="text-gray-500">Operational data for Dispatch / Batches will appear here.</p>
      </Card>
    </div>
  );
}
export default DispatchBatchesPage;
