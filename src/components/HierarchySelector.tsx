/**
 * HierarchySelector — persistent geographic/organizational scope selector.
 *
 * Desktop: horizontal dropdown bar showing current selection.
 * Mobile: compact breadcrumb with drill-down navigation.
 *
 * Fetches hierarchies (regions, cities, areas, sectors, businesses, shops) on demand
 * as the user navigates the tree.
 */

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faTimes,
  faMapPin,
} from '@fortawesome/free-solid-svg-icons';
import { useHierarchy, type HierarchyNode } from '@/context/HierarchyContext';
import { platformAdminService } from '@/services/platformAdmin.service';
import { locationsService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';

/**
 * Dropdown menu for a single hierarchy level.
 */
function HierarchyDropdown({
  label,
  current,
  onSelect,
  isLoading,
  options,
  onOpen,
}: {
  label: string;
  current: HierarchyNode | null;
  onSelect: (node: HierarchyNode | null) => void;
  isLoading: boolean;
  options: HierarchyNode[];
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      onOpen();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isLoading || options.length === 0}
        className="flex items-center gap-1 rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700"
      >
        <span className="hidden sm:inline">{label}</span>
        <span className="truncate text-xs sm:text-sm">
          {current ? current.name : 'All'}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          size="xs"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-max rounded border border-gray-200 bg-white shadow-lg dark:border-dark-700 dark:bg-dark-800">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700"
          >
            All {label.toLowerCase()}
          </button>

          {isLoading ? (
            <div className="px-4 py-2 text-xs text-gray-500">Loading...</div>
          ) : options.length === 0 ? (
            <div className="px-4 py-2 text-xs text-gray-500">No options</div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 ${
                  current?.id === option.id
                    ? 'bg-blue-50 font-semibold text-blue-600 dark:bg-dark-700'
                    : ''
                }`}
              >
                {option.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-friendly drill-down breadcrumb.
 */
function HierarchyBreadcrumbMobile() {
  const { getPath, clearAll } = useHierarchy();
  const path = getPath();

  if (path.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2 rounded bg-blue-50 px-3 py-2 dark:bg-dark-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
          {path.map((node, idx) => (
            <div key={node.id} className="flex items-center gap-1">
              {idx > 0 && <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />}
              <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                {node.name}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={clearAll}
          title="Clear selection"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-dark-700"
        >
          <FontAwesomeIcon icon={faTimes} size="sm" />
        </button>
      </div>
    </div>
  );
}

/**
 * Main HierarchySelector component.
 */
export function HierarchySelector() {
  const { selection, setRegion, setCity, setArea, setSector, setBusiness, setShop, clearAll } =
    useHierarchy();

  // Load available options for each level
  const regionsAsync = useAsync(
    () => locationsService.list({ type: 'region' }).then((res) => res.items),
    []
  );

  const citiesAsync = useAsync(
    () =>
      selection.region
        ? locationsService.list({ type: 'city', parentId: selection.region.id }).then((res) => res.items)
        : Promise.resolve([]),
    [selection.region?.id]
  );

  const areasAsync = useAsync(
    () =>
      selection.city
        ? locationsService.list({ type: 'area', parentId: selection.city.id }).then((res) => res.items)
        : Promise.resolve([]),
    [selection.city?.id]
  );

  const sectorsAsync = useAsync(
    () =>
      selection.area
        ? locationsService.list({ type: 'sector', parentId: selection.area.id }).then((res) => res.items)
        : Promise.resolve([]),
    [selection.area?.id]
  );

  const businessesAsync = useAsync(
    () =>
      selection.sector
        ? platformAdminService.listBusinessesByHierarchy(selection.sector.id, 'sector').then((res) => res.items)
        : Promise.resolve([]),
    [selection.sector?.id]
  );

  const shopsAsync = useAsync(
    () =>
      selection.business
        ? platformAdminService.listShopsByHierarchy(selection.business.id, 'business').then((res) => res.items)
        : Promise.resolve([]),
    [selection.business?.id]
  );

  // Map locations to HierarchyNode
  const regions = (regionsAsync.data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    type: 'region' as const,
    code: loc.code,
  }));

  const cities = (citiesAsync.data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    type: 'city' as const,
    code: loc.code,
  }));

  const areas = (areasAsync.data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    type: 'area' as const,
    code: loc.code,
  }));

  const sectors = (sectorsAsync.data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    type: 'sector' as const,
    code: loc.code,
  }));

  const businesses = (businessesAsync.data || []).map((biz: any) => ({
    id: biz.id,
    name: biz.name,
    type: 'business' as const,
  }));

  const shops = (shopsAsync.data || []).map((shop: any) => ({
    id: shop.id,
    name: shop.name,
    type: 'shop' as const,
  }));

  // Desktop: show all dropdowns in horizontal bar
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-800">
      {/* Mobile breadcrumb */}
      <div className="md:hidden">
        <HierarchyBreadcrumbMobile />
      </div>

      {/* Desktop bar */}
      <div className="hidden gap-2 overflow-x-auto md:flex">
        <div className="flex items-center gap-2 flex-nowrap">
          <FontAwesomeIcon icon={faMapPin} className="text-gray-500" />

          <HierarchyDropdown
            label="Region"
            current={selection.region}
            onSelect={setRegion}
            isLoading={regionsAsync.loading}
            options={regions}
            onOpen={() => {}}
          />

          {selection.region && (
            <HierarchyDropdown
              label="City"
              current={selection.city}
              onSelect={setCity}
              isLoading={citiesAsync.loading}
              options={cities}
              onOpen={() => {}}
            />
          )}

          {selection.city && (
            <HierarchyDropdown
              label="Area"
              current={selection.area}
              onSelect={setArea}
              isLoading={areasAsync.loading}
              options={areas}
              onOpen={() => {}}
            />
          )}

          {selection.area && (
            <HierarchyDropdown
              label="Sector"
              current={selection.sector}
              onSelect={setSector}
              isLoading={sectorsAsync.loading}
              options={sectors}
              onOpen={() => {}}
            />
          )}

          {selection.sector && (
            <HierarchyDropdown
              label="Business"
              current={selection.business}
              onSelect={setBusiness}
              isLoading={businessesAsync.loading}
              options={businesses}
              onOpen={() => {}}
            />
          )}

          {selection.business && (
            <HierarchyDropdown
              label="Shop"
              current={selection.shop}
              onSelect={setShop}
              isLoading={shopsAsync.loading}
              options={shops}
              onOpen={() => {}}
            />
          )}

          {/* Clear button */}
          {(selection.region ||
            selection.city ||
            selection.area ||
            selection.sector ||
            selection.business ||
            selection.shop) && (
            <button
              type="button"
              onClick={clearAll}
              title="Clear hierarchy selection"
              className="ml-2 rounded bg-red-50 px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
