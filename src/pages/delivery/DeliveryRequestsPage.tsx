import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function DeliveryRequestsPage() {
  return (
    <div>
      <PageHeader title="Delivery Requests" description="Manage delivery requests" />
      <Card>
        <p className="text-gray-500">Operational data for Delivery Requests will appear here.</p>
      </Card>
    </div>
  );
}
export default DeliveryRequestsPage;
