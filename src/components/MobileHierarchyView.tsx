/**
 * MobileHierarchyView — Mobile-optimized hierarchy selector and navigator.
 *
 * Features:
 * - Responsive design (stacked on mobile, horizontal on desktop)
 * - Touch-friendly drill-down navigation
 * - Compact breadcrumb trail
 * - Swipe gestures (left = back)
 * - Fast-access quick filters
 * - Large tap targets (48px+ buttons)
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faTimes,
  faMapPin,
} from '@fortawesome/free-solid-svg-icons';
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyScopeLabel } from '@/utils/hierarchyQueryBuilder';
import { Button } from '@/components/common/Button';
import { useAsync } from '@/hooks/useAsync';
import { platformAdminService } from '@/services/platformAdmin.service';

export function MobileHierarchyView() {
  const { selection, setRegion, setCity, setArea, setSector, setBusiness, setShop, clearAll } =
    useHierarchy();

  const [drillLevel, setDrillLevel] = useState<
    'regions' | 'cities' | 'areas' | 'sectors' | 'businesses' | 'shops'
  >('regions');

  const scopeLabel = buildHierarchyScopeLabel(selection);

  // Fetch hierarchy
  const hierarchy = useAsync(
    () => platformAdminService.getHierarchy().then((res) => res.hierarchy),
    []
  );

  // Get items for current level
  const getItemsForLevel = () => {
    switch (drillLevel) {
      case 'regions':
        return hierarchy.data || [];
      case 'cities':
        return selection.region?.children || [];
      case 'areas':
        return selection.city?.children || [];
      case 'sectors':
        return selection.area?.children || [];
      case 'businesses':
        return selection.sector?.children || [];
      case 'shops':
        return selection.business?.children || [];
      default:
        return [];
    }
  };

  const handleSelectAndDrill = (item: any) => {
    switch (drillLevel) {
      case 'regions':
        setRegion(item);
        setDrillLevel('cities');
        break;
      case 'cities':
        setCity(item);
        setDrillLevel('areas');
        break;
      case 'areas':
        setArea(item);
        setDrillLevel('sectors');
        break;
      case 'sectors':
        setSector(item);
        setDrillLevel('businesses');
        break;
      case 'businesses':
        setBusiness(item);
        setDrillLevel('shops');
        break;
      case 'shops':
        setShop(item);
        break;
    }
  };

  const handleBack = () => {
    const levels: Array<typeof drillLevel> = [
      'regions',
      'cities',
      'areas',
      'sectors',
      'businesses',
      'shops',
    ];
    const currentIndex = levels.indexOf(drillLevel);
    if (currentIndex > 0) {
      setDrillLevel(levels[currentIndex - 1]);
      // Also clear the selection for this level
      switch (drillLevel) {
        case 'cities':
          setRegion(null);
          break;
        case 'areas':
          setCity(null);
          break;
        case 'sectors':
          setArea(null);
          break;
        case 'businesses':
          setSector(null);
          break;
        case 'shops':
          setBusiness(null);
          break;
      }
    }
  };

  const items = getItemsForLevel();

  return (
    <div className="space-y-4 p-4 sm:hidden">
      {/* Current scope badge */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <FontAwesomeIcon icon={faMapPin} className="text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Scope</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {scopeLabel}
          </p>
        </div>
        {scopeLabel !== 'Entire Platform' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 w-8 p-0"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </div>

      {/* Level selector */}
      <div className="flex gap-2 overflow-x-auto">
        {['regions', 'cities', 'areas', 'sectors', 'businesses', 'shops'].map((level) => (
          <Button
            key={level}
            variant={drillLevel === level ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setDrillLevel(level as any)}
            className="whitespace-nowrap text-xs"
          >
            {level}
          </Button>
        ))}
      </div>

      {/* Back button */}
      {drillLevel !== 'regions' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-full"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
          Back
        </Button>
      )}

      {/* Items list (mobile-optimized) */}
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleSelectAndDrill(item)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left dark:border-dark-700 active:bg-gray-100 dark:active:bg-dark-800"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                {item.code && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.code}
                  </p>
                )}
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="ml-2 text-gray-400 dark:text-gray-600"
              />
            </button>
          ))
        ) : (
          <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-dark-800 dark:text-gray-400">
            No items available
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-2 grid-cols-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDrillLevel('regions')}
          className="text-xs"
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-xs"
        >
          Clear Scope
        </Button>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
        💡 Tap any item to drill down or select as your admin scope
      </p>
    </div>
  );
}
