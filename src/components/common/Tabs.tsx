/**
 * Tabs Component
 * Provides tabbed interface with navigation.
 *
 * Two supported shapes:
 *  1. Declarative registry:  <Tabs tabs={[{ value, label }]} activeTab onChange />
 *  2. Composed children:     <Tabs activeTab onChange><Tab ... /></Tabs>
 */

import { ReactNode } from 'react';

export interface TabItem {
  /** Preferred identifier. */
  value?: string;
  /** Legacy alias for `value` (kept for existing callers). */
  id?: string;
  label: string;
}

export interface TabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  /** Optional declarative tab registry — rendered as buttons. */
  tabs?: TabItem[];
  /** Optional composed tabs (rendered after the registry). */
  children?: ReactNode;
}

export interface TabProps {
  id: string;
  label: string;
}

export interface TabContentProps {
  children: ReactNode;
}

/**
 * Shared tab-button styling.
 *
 * `whitespace-nowrap` + the strip's `overflow-x-auto` is what makes a long tab
 * list scroll horizontally on narrow screens instead of squashing or wrapping.
 * The underline uses the app's primary tokens so tabs match the rest of the
 * console (sidebar, buttons).
 */
const TAB_BUTTON_CLASS =
  '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/40 sm:px-6';

function tabButtonClass(isActive: boolean): string {
  return `${TAB_BUTTON_CLASS} ${
    isActive
      ? 'border-primary-dark text-primary-dark dark:border-primary-color dark:text-primary-color'
      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-dark-600 dark:hover:text-white'
  }`;
}

export function Tabs({ activeTab, onChange, tabs, children }: TabsProps) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <div className="flex min-w-max space-x-1" role="tablist">
          {(tabs ?? []).map((tab) => {
            const id = tab.value ?? tab.id ?? tab.label;
            const isActive = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(id)}
                className={tabButtonClass(isActive)}
              >
                {tab.label}
              </button>
            );
          })}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Tab({
  id,
  label,
  isActive,
  onClick,
}: TabProps & { isActive?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={Boolean(isActive)}
      onClick={onClick}
      className={tabButtonClass(Boolean(isActive))}
      data-tab-id={id}
    >
      {label}
    </button>
  );
}

export function TabContent({ children }: TabContentProps) {
  return <div className="mt-6">{children}</div>;
}
