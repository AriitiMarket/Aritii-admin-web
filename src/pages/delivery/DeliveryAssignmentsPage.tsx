import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { ReadyOrdersPanel } from './dispatch/ReadyOrdersPanel';
import { AssignmentListPanel } from './dispatch/AssignmentListPanel';
import { AssignmentsTab } from './tabs/AssignmentsTab';

type Tab = 'ready' | 'assign' | 'batches';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ready', label: 'Ready for Delivery' },
  { id: 'assign', label: 'Assign / Reassign' },
  { id: 'batches', label: 'Batches' },
];

function isTab(v: string | null): v is Tab {
  return !!v && TABS.some((t) => t.id === v);
}

/**
 * Delivery & Logistics -> Assignments — ONE workspace for the whole
 * assignment workflow (it also absorbs the former Dispatch / Batches page):
 *
 *   Ready for Delivery — pick many eligible orders and hand them to a rider
 *                        in a single batch operation.
 *   Assign / Reassign  — every delivery with its rider, plus per-order assign,
 *                        reassign and status transitions.
 *   Batches            — the batches created from ready orders: riders,
 *                        progress, and a link into each detail page.
 *
 * The active tab lives in `?tab=` so deep links (including the dashboard's
 * "View All" and the legacy /delivery/dispatch URL) open the right view.
 */
export function DeliveryAssignmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('tab');
  const tab: Tab = isTab(param) ? param : 'ready';

  const selectTab = (id: Tab) => {
    setSearchParams(id === 'ready' ? {} : { tab: id }, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Ready orders, per-delivery assign/reassign, and the batches they become."
      />

      <div className="mb-4">
        <Tabs
          activeTab={tab}
          onChange={(id) => selectTab(id as Tab)}
          tabs={TABS.map(({ id, label }) => ({ value: id, label }))}
        />
      </div>

      <div role="tabpanel">
        {tab === 'ready' && <ReadyOrdersPanel />}
        {tab === 'assign' && <AssignmentsTab />}
        {tab === 'batches' && <AssignmentListPanel />}
      </div>
    </div>
  );
}
