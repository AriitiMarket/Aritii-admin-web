/**
 * Tabs Component
 * Provides tabbed interface with navigation
 */

import { ReactNode } from 'react';

export interface TabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  children: ReactNode;
}

export interface TabProps {
  id: string;
  label: string;
}

export interface TabContentProps {
  children: ReactNode;
}

export function Tabs({ activeTab, onChange, children }: TabsProps) {
  return (
    <div className="w-full">
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-1 bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Tab({ id, label }: TabProps & { isActive?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
        id === 'active'
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

export function TabContent({ children }: TabContentProps) {
  return <div className="mt-6">{children}</div>;
}
