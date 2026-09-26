import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReadyOrdersPanel } from './dispatch/ReadyOrdersPanel';
import { AssignmentListPanel } from './dispatch/AssignmentListPanel';

type Tab = 'ready' | 'assignments';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ready', label: 'Ready for Delivery' },
  { id: 'assignments', label: 'Assignments' },
];

/**
 * Delivery & Logistics -> Assignments.
 *
 * Two views over the one multi-order dispatch workflow:
 *   "Ready for Delivery"  — pick many eligible orders and assign them to a rider
 *                          in a single batch operation.
 *   "Assignments"         — every assignment created this way, with live
 *                          per-order progress and a link into its detail page.
 */
export function DeliveryAssignmentsPage() {
  const [tab, setTab] = useState<Tab>('ready');

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Select ready orders, assign them to a rider in one operation, and follow each order's own status to delivery."
      />

      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-dark-600" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={
              tab === id
                ? 'border-b-2 border-primary-dark px-4 py-2 text-sm font-medium text-primary-dark'
                : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'ready' ? <ReadyOrdersPanel /> : <AssignmentListPanel />}
    </div>
  );
}
