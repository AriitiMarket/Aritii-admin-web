/** Marketplace sector. Sectors scope what an admin can see/manage. */
export interface Sector {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  createdAt?: string;
}

/** A sector-aware admin: the sectors an admin is allowed to operate in. */
export interface SectorAssignment {
  sectorId: string;
  adminId: string;
}