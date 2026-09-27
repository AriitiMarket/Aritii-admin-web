import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';

export function ConsolidationPage() {
  return (
    <div>
      <PageHeader title="Consolidation" description="Manage consolidation" />
      <Card>
        <p className="text-gray-500">Operational data for Consolidation will appear here.</p>
      </Card>
    </div>
  );
}
export default ConsolidationPage;
