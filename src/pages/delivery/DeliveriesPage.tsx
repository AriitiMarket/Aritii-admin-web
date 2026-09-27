import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function DeliveriesPage() {
  return (
    <div>
      <PageHeader title="Deliveries" description="Manage deliveries" />
      <Card>
        <p className="text-gray-500">Operational data for Deliveries will appear here.</p>
      </Card>
    </div>
  );
}
export default DeliveriesPage;
