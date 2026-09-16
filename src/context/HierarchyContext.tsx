/**
 * Hierarchy Context — unified geographic & organizational scope for all admin modules.
 *
 * Maintains selection state across:
 *   Platform → Region → City → Area → Sector → Business → Shop
 *
 * All selections persist to localStorage and are automatically available to any page via useHierarchy().
 * Changes to hierarchy trigger re-renders of dependent pages, making it trivial for any module
 * to respect the current scope without duplicating state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface HierarchyNode {
  id: string;
  name: string;
  type: 'platform' | 'region' | 'city' | 'area' | 'sector' | 'business' | 'shop';
  code?: string;
  parentId?: string;
}

export interface HierarchySelection {
  platform: HierarchyNode | null;
  region: HierarchyNode | null;
  city: HierarchyNode | null;
  area: HierarchyNode | null;
  sector: HierarchyNode | null;
  business: HierarchyNode | null;
  shop: HierarchyNode | null;
}

interface HierarchyContextValue {
  selection: HierarchySelection;
  setRegion: (node: HierarchyNode | null) => void;
  setCity: (node: HierarchyNode | null) => void;
  setArea: (node: HierarchyNode | null) => void;
  setSector: (node: HierarchyNode | null) => void;
  setBusiness: (node: HierarchyNode | null) => void;
  setShop: (node: HierarchyNode | null) => void;
  clearBelow: (level: keyof HierarchySelection) => void;
  clearAll: () => void;
  getPath: () => HierarchyNode[];
  getPathString: () => string;
  isAnySelected: () => boolean;
}

const STORAGE_KEY = 'adminHierarchySelection';

export const HierarchyContext = createContext<HierarchyContextValue | undefined>(undefined);

/**
 * Default platform node (always available, represents no scope restriction).
 */
const PLATFORM_NODE: HierarchyNode = {
  id: 'platform',
  name: 'All Regions',
  type: 'platform',
};

function serializeSelection(selection: HierarchySelection): string {
  return JSON.stringify({
    region: selection.region?.id || null,
    city: selection.city?.id || null,
    area: selection.area?.id || null,
    sector: selection.sector?.id || null,
    business: selection.business?.id || null,
    shop: selection.shop?.id || null,
  });
}

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<HierarchySelection>({
    platform: PLATFORM_NODE,
    region: null,
    city: null,
    area: null,
    sector: null,
    business: null,
    shop: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelection({
          platform: PLATFORM_NODE,
          region: parsed.region ? { id: parsed.region, name: '', type: 'region' } : null,
          city: parsed.city ? { id: parsed.city, name: '', type: 'city' } : null,
          area: parsed.area ? { id: parsed.area, name: '', type: 'area' } : null,
          sector: parsed.sector ? { id: parsed.sector, name: '', type: 'sector' } : null,
          business: parsed.business ? { id: parsed.business, name: '', type: 'business' } : null,
          shop: parsed.shop ? { id: parsed.shop, name: '', type: 'shop' } : null,
        });
      } catch {
        // Ignore corrupted storage
      }
    }
  }, []);

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, serializeSelection(selection));
    }
  }, [selection]);

  const setRegion = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      region: node,
      // Clear dependent levels
      city: null,
      area: null,
      sector: null,
      business: null,
      shop: null,
    }));
  }, []);

  const setCity = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      city: node,
      // Clear dependent levels
      area: null,
      sector: null,
      business: null,
      shop: null,
    }));
  }, []);

  const setArea = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      area: node,
      // Clear dependent levels
      sector: null,
      business: null,
      shop: null,
    }));
  }, []);

  const setSector = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      sector: node,
      // Clear dependent levels
      business: null,
      shop: null,
    }));
  }, []);

  const setBusiness = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      business: node,
      // Clear dependent levels
      shop: null,
    }));
  }, []);

  const setShop = useCallback((node: HierarchyNode | null) => {
    setSelection((prev) => ({
      ...prev,
      shop: node,
    }));
  }, []);

  const clearBelow = useCallback((level: keyof HierarchySelection) => {
    const levelMap: Record<keyof HierarchySelection, Array<keyof HierarchySelection>> = {
      platform: ['region', 'city', 'area', 'sector', 'business', 'shop'],
      region: ['city', 'area', 'sector', 'business', 'shop'],
      city: ['area', 'sector', 'business', 'shop'],
      area: ['sector', 'business', 'shop'],
      sector: ['business', 'shop'],
      business: ['shop'],
      shop: [],
    };

    const toCleared = levelMap[level] || [];
    setSelection((prev) => {
      const next = { ...prev };
      toCleared.forEach((k) => {
        (next[k] as any) = null;
      });
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelection({
      platform: PLATFORM_NODE,
      region: null,
      city: null,
      area: null,
      sector: null,
      business: null,
      shop: null,
    });
  }, []);

  const getPath = useCallback(() => {
    const path: HierarchyNode[] = [selection.platform!];
    if (selection.region) path.push(selection.region);
    if (selection.city) path.push(selection.city);
    if (selection.area) path.push(selection.area);
    if (selection.sector) path.push(selection.sector);
    if (selection.business) path.push(selection.business);
    if (selection.shop) path.push(selection.shop);
    return path;
  }, [selection]);

  const getPathString = useCallback(() => {
    const path = getPath();
    return path.map((n) => n.name).join(' / ');
  }, [getPath]);

  const isAnySelected = useCallback(() => {
    return !!(selection.region || selection.city || selection.area || selection.sector || selection.business || selection.shop);
  }, [selection]);

  const value = useMemo<HierarchyContextValue>(
    () => ({
      selection,
      setRegion,
      setCity,
      setArea,
      setSector,
      setBusiness,
      setShop,
      clearBelow,
      clearAll,
      getPath,
      getPathString,
      isAnySelected,
    }),
    [selection, setRegion, setCity, setArea, setSector, setBusiness, setShop, clearBelow, clearAll, getPath, getPathString, isAnySelected]
  );

  return <HierarchyContext.Provider value={value}>{children}</HierarchyContext.Provider>;
}

/**
 * Hook to access hierarchy context. Throws if used outside HierarchyProvider.
 */
export function useHierarchy(): HierarchyContextValue {
  const context = useContext(HierarchyContext);
  if (!context) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}
