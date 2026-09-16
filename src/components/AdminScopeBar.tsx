/**
 * AdminScopeBar — Shows current admin hierarchy scope on every page.
 *
 * Displays:
 * - "Scope: Entire Platform" (no selection)
 * - "Scope: Oromia / Harar / Food" (with selection)
 * - [Change] button to select different hierarchy
 * - [Clear] button to reset to entire platform
 *
 * This bar is UNIFIED across all Admin modules.
 * No module has its own scope indicator.
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useHierarchy } from '@/hooks/useHierarchy';
import {
  buildHierarchyScopeLabel,
  getSelectedLevelName,
} from '@/utils/hierarchyQueryBuilder';
import { Button } from '@/components/common/Button';

export interface AdminScopeBarProps {
  onSelectHierarchy?: () => void;
}

export function AdminScopeBar({ onSelectHierarchy }: AdminScopeBarProps) {
  const { selection, getPath, clearAll } = useHierarchy();
  const path = getPath();
  const label = buildHierarchyScopeLabel(selection);
  const levelName = getSelectedLevelName(selection);

  const isScoped = path.length > 1; // More than just Platform

  return (
    <div
      className={`border-b px-4 py-3 ${
        isScoped
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-gray-50 dark:bg-dark-900'
      } border-gray-200 dark:border-dark-700`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Scope indicator */}
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faMapPin}
            className={isScoped ? 'text-blue-600' : 'text-gray-400'}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>

          {/* Breadcrumb path */}
          {isScoped && (
            <div className="ml-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {path.map((node, idx) => (
                <div key={node.id} className="flex items-center gap-1">
                  {idx > 0 && <FontAwesomeIcon icon={faChevronRight} size="xs" />}
                  <span>{node.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onSelectHierarchy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectHierarchy}
            >
              {isScoped ? 'Change' : 'Select'} Scope
            </Button>
          )}

          {isScoped && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
              <span className="ml-1">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Info: What this scope affects */}
      {isScoped && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          📊 All data on this page is scoped to: <strong>{levelName}</strong>
          <br />
          💡 Change scope from the sidebar hierarchy selector or click "Change Scope" above.
        </div>
      )}
    </div>
  );
}
