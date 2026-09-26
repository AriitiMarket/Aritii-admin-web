// Expansion Progress Tracker Component

import type { ExpansionProgress } from '../types';

interface ExpansionProgressTrackerProps {
  progress: ExpansionProgress;
  locationName: string;
  expansionStatus: string;
}

export function ExpansionProgressTracker({
  progress,
  locationName,
  expansionStatus,
}: ExpansionProgressTrackerProps) {
  const steps = [
    { key: 'locationCreated', label: 'Location Created' },
    { key: 'serviceabilityConfigured', label: 'Serviceability Configured' },
    { key: 'zonesConfigured', label: 'Delivery Zones Configured' },
    { key: 'hubConfigured', label: 'Hub Configured' },
    { key: 'routesConfigured', label: 'Routes Configured' },
    { key: 'providersConfigured', label: 'Providers Assigned' },
    { key: 'serviceabilityTested', label: 'Serviceability Tested' },
    { key: 'approved', label: 'Admin Approved' },
    { key: 'activated', label: 'Activated' },
  ];

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300';
      case 'testing':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300';
      case 'suspended':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300';
      case 'closed':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{locationName} Expansion</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expansionStatus)}`}>
              {expansionStatus.charAt(0).toUpperCase() + expansionStatus.slice(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount} of {steps.length} steps completed
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercent}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className="bg-primary-dark h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = progress[step.key as keyof ExpansionProgress];
          const isCurrent = !isCompleted && index > 0 && progress[steps[index - 1].key as keyof ExpansionProgress];
          
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isCompleted
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`text-sm ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-300 line-through'
                    : isCurrent
                    ? 'text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {expansionStatus === 'active' ? (
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-sm">
            View Details
          </button>
          <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 text-sm">
            Suspend
          </button>
        </div>
      ) : expansionStatus === 'planned' || expansionStatus === 'preparing' || expansionStatus === 'testing' ? (
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-sm">
            Edit Plan
          </button>
          <button className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary text-sm">
            Continue Setup
          </button>
        </div>
      ) : null}
    </div>
  );
}