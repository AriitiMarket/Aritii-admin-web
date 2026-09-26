/**
 * Operational connections service (Delivery `DeliveryRoute` contract).
 *
 * A connection is a directed, admin-owned link between two EXISTING locations,
 * e.g. `Harar > Sector A` -> `Dire Dawa > Sector B`. It is the operational
 * counterpart of the location catalogue: the catalogue says where things are, a
 * connection says what the operation RUNS BETWEEN. `waypoints` are intermediate
 * locations, which is how a chained operation (Harar -> Sector A -> Dire Dawa ->
 * Sector B) is expressed without inventing a second model.
 *
 * Backend endpoints (all under the gateway's `/delivery` prefix):
 *   GET  /delivery/route                              -> { routes, count }
 *   GET  /delivery/route/:id                          -> { route }
 *   POST /delivery/route                              -> { route }
 *   PUT  /delivery/route/:id                          -> { route }
 *   GET  /delivery/route/search?originId&destinationId -> { route | null }
 *
 * The backend is authoritative: it refuses a connection whose origin or
 * destination is inactive (400), refuses a duplicate pair (409) and validates
 * `status` against ['active', 'inactive', 'suspended']. This layer maps the
 * envelope and the `_id` -> `id` boundary; it deliberately does not re-implement
 * those rules, so a rejection surfaces as a real ApiError message.
 */
import { http } from '@/services/client/httpClient';

/** Mirrors the `Route` model enum — sending anything else is a 500. */
export type ConnectionStatus = 'active' | 'inactive' | 'suspended';

export interface OperationalConnection {
  id: string;
  name: string;
  originLocationId: string;
  destinationLocationId: string;
  status: ConnectionStatus;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
  description: string;
  /** Intermediate locations, in order (ids). */
  waypoints: string[];
}

export interface ConnectionInput {
  name: string;
  originLocationId: string;
  destinationLocationId: string;
  status?: ConnectionStatus;
  distanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  description?: string;
}

export interface ConnectionListFilter {
  status?: ConnectionStatus | '';
  /** Either end of the connection. */
  locationId?: string;
  /** Origin only (e.g. every connection leaving Harar). */
  originLocationId?: string;
  /** Destination only. */
  destinationLocationId?: string;
  page?: number;
  limit?: number;
}

export interface ConnectionListResponse {
  connections: OperationalConnection[];
  total: number;
}

type ApiRecord = Record<string, unknown>;

function asRecord(raw: unknown): ApiRecord {
  return raw && typeof raw === 'object' ? (raw as ApiRecord) : {};
}

/** Mongo returns `_id`; the UI uses `id` everywhere. */
function withId<T extends object>(raw: unknown): T & { id: string } {
  const record = asRecord(raw);
  return { ...(record as T), id: String(record.id ?? record._id ?? '') } as T & { id: string };
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStatus(value: unknown): ConnectionStatus {
  return value === 'inactive' || value === 'suspended' ? value : 'active';
}

export function toConnection(raw: unknown): OperationalConnection {
  const record = asRecord(raw);
  const mapped = withId<Record<string, unknown>>(record);
  return {
    id: mapped.id,
    name: String(record.name ?? ''),
    originLocationId: String(record.originLocationId ?? ''),
    destinationLocationId: String(record.destinationLocationId ?? ''),
    status: toStatus(record.status),
    distanceKm: toNumber(record.distanceKm),
    estimatedDurationMinutes: toNumber(record.estimatedDurationMinutes),
    description: String(record.description ?? ''),
    waypoints: Array.isArray(record.waypoints) ? record.waypoints.map((w) => String(w)) : [],
  };
}

class ConnectionsService {
  /** Connections, optionally narrowed by status and by either/both ends. */
  async list(filter: ConnectionListFilter = {}): Promise<ConnectionListResponse> {
    const params: Record<string, string | number> = {
      page: filter.page ?? 1,
      limit: filter.limit ?? 200,
    };
    if (filter.status) params.status = filter.status;
    if (filter.locationId) params.locationId = filter.locationId;
    if (filter.originLocationId) params.originLocationId = filter.originLocationId;
    if (filter.destinationLocationId) params.destinationLocationId = filter.destinationLocationId;

    const response = await http.get<{ routes?: unknown[]; count?: number }>('/delivery/route', {
      params,
    });
    const routes = Array.isArray(response.routes) ? response.routes : [];
    const connections = routes.map(toConnection);
    return {
      connections,
      total: typeof response.count === 'number' ? response.count : connections.length,
    };
  }

  async get(id: string): Promise<OperationalConnection> {
    const response = await http.get<{ route?: unknown }>(`/delivery/route/${id}`);
    return toConnection(response.route);
  }

  /** Existing connection between two locations, or null. */
  async findBetween(originId: string, destinationId: string): Promise<OperationalConnection | null> {
    const response = await http.get<{ route?: unknown }>('/delivery/route/search', {
      params: { originId, destinationId },
    });
    return response.route ? toConnection(response.route) : null;
  }

  /** Keys with `undefined` values are dropped so a PUT never clears a field by accident. */
  private static body(fields: Partial<ConnectionInput>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) body[key] = value;
    });
    return body;
  }

  async create(input: ConnectionInput): Promise<OperationalConnection> {
    const response = await http.post<{ route?: unknown }>(
      '/delivery/route',
      ConnectionsService.body(input)
    );
    return toConnection(response.route);
  }

  async update(id: string, fields: Partial<ConnectionInput>): Promise<OperationalConnection> {
    const response = await http.put<{ route?: unknown }>(
      `/delivery/route/${id}`,
      ConnectionsService.body(fields)
    );
    return toConnection(response.route);
  }

  /**
   * Activates/deactivates a connection.
   *
   * Deactivation is the ONLY supported way to stop a connection: nothing is
   * deleted, so historical deliveries that ran over it keep resolving.
   */
  async setStatus(id: string, status: ConnectionStatus): Promise<OperationalConnection> {
    return this.update(id, { status });
  }
}

export const connectionsService = new ConnectionsService();
