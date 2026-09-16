/**
 * Sector selection context.
 * The marketplace is organized into sectors; admins can scope the dashboard
 * and feature lists to a sector ("All sectors" selects none).
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
import type { Sector } from '@/types';
import { catalogService } from '@/services/catalog.service';

const STORAGE_KEY = 'selectedSector';

interface SectorContextValue {
  sectors: Sector[];
  selectedSector: string;
  setSelectedSector: (sectorId: string) => void;
  selectedSectorName: string;
  loading: boolean;
}

export const SectorContext = createContext<SectorContextValue | undefined>(undefined);

export function SectorProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSectorState] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Only fetch sectors if they haven't been fetched yet
    if (sectors.length > 0) {
      setLoading(false);
      return;
    }

    // Skip if no token (not logged in)
    const token = typeof window !== 'undefined' 
      ? window.localStorage.getItem('token')
      : null;
    
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    catalogService
      .listSectors()
      .then((list) => {
        if (!mounted) return;
        setSectors(list);
        const stored =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        if (stored && list.some((sector) => sector.id === stored)) {
          setSelectedSectorState(stored);
        }
      })
      .catch(() => {
        if (mounted) setSectors([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setSelectedSector = useCallback((sectorId: string) => {
    setSelectedSectorState(sectorId);
    if (typeof window !== 'undefined') {
      if (sectorId === 'all') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, sectorId);
    }
  }, []);

  const selectedSectorName = useMemo(() => {
    if (selectedSector === 'all') return '';
    return sectors.find((sector) => sector.id === selectedSector)?.name ?? '';
  }, [selectedSector, sectors]);

  const value = useMemo<SectorContextValue>(
    () => ({
      sectors,
      selectedSector,
      setSelectedSector,
      selectedSectorName,
      loading,
    }),
    [sectors, selectedSector, setSelectedSector, selectedSectorName, loading]
  );

  return <SectorContext.Provider value={value}>{children}</SectorContext.Provider>;
}

export function useSectorContext(): SectorContextValue {
  const context = useContext(SectorContext);
  if (!context) {
    throw new Error('useSectorContext must be used within a SectorProvider');
  }
  return context;
}