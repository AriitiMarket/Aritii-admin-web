import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function TrackingPage() {
  return (
    <div>
      <PageHeader title="Tracking" description="Manage tracking" />
      <Card>
        <p className="text-gray-500">Operational data for Tracking will appear here.</p>
      </Card>
    </div>
  );
}
export default TrackingPage;
