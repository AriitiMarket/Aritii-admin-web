import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function ShipmentsPage() {
  return (
    <div>
      <PageHeader title="Shipments" description="Manage shipments" />
      <Card>
        <p className="text-gray-500">Operational data for Shipments will appear here.</p>
      </Card>
    </div>
  );
}
export default ShipmentsPage;
