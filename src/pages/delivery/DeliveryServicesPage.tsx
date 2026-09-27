import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function DeliveryServicesPage() {
  return (
    <div>
      <PageHeader title="Delivery Services" description="Manage delivery services" />
      <Card>
        <p className="text-gray-500">Operational data for Delivery Services will appear here.</p>
      </Card>
    </div>
  );
}
export default DeliveryServicesPage;
