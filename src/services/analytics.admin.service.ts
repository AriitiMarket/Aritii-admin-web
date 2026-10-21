import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/** Query parameters accepted by the analytics endpoints. */
export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Headline platform counters shown on the dashboard. */
export type PlatformStats = Record<string, number | string>;

/** A breakdown slice (orders by type, sales by type). */
export type TypeBreakdown = Record<string, number>;

/** One point of the users/orders growth series. */
export interface GrowthPoint {
  date: string;
  users?: number;
  orders?: number;
  revenue?: number;
}

/** A detected anomaly. */
export interface AnalyticsAnomaly {
  metric: string;
  severity: string;
  description: string;
  detectedAt: string;
}

/** One point of the forecast series. */
export interface ForecastPoint {
  date: string;
  predictedOrders?: number;
  confidence?: number;
  predictedRevenue?: number;
}

class AnalyticsService {
  BASE = '/analytics';

  /** The server's message for a failed call, or a generic fallback. */
  private static reason(err: unknown, fallback: string): string {
    if (isApiError(err) && err.message) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  /**
   * Get platform statistics
   * @param params - Query parameters (dateFrom, dateTo, etc)
   */
  async getPlatformStats(params: AnalyticsParams = {}): Promise<PlatformStats> {
    try {
      const data = await http.get<{ stats?: PlatformStats }>(`${this.BASE}/stats`, {
        params,
      });
      return data?.stats || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch platform stats: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get users growth over time
   * @param params - Query parameters
   */
  async getUsersGrowth(params: AnalyticsParams = {}): Promise<GrowthPoint[]> {
    try {
      const data = await http.get<{ growth?: GrowthPoint[] }>(`${this.BASE}/growth`, {
        params,
      });
      return data?.growth || [];
    } catch (err) {
      throw new Error(
        `Failed to fetch users growth: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get orders breakdown by type
   * @param params - Query parameters
   */
  async getOrdersByType(params: AnalyticsParams = {}): Promise<TypeBreakdown> {
    try {
      const data = await http.get<{ orders?: TypeBreakdown }>(
        `${this.BASE}/orders-by-type`,
        { params }
      );
      return data?.orders || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch orders by type: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get sales breakdown by type
   * @param params - Query parameters
   */
  async getSalesByType(params: AnalyticsParams = {}): Promise<TypeBreakdown> {
    try {
      const data = await http.get<{ sales?: TypeBreakdown }>(
        `${this.BASE}/sales-by-type`,
        { params }
      );
      return data?.sales || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch sales by type: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get dashboard user metrics
   * @param params - Query parameters
   */
  async getDashboardUsers(params: AnalyticsParams = {}): Promise<PlatformStats> {
    try {
      const data = await http.get<{ users?: PlatformStats }>(
        `${this.BASE}/dashboard-users`,
        { params }
      );
      return data?.users || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch dashboard users: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get complete analytics dashboard
   * @param params - Query parameters
   */
  async getDashboard(params: AnalyticsParams = {}): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ dashboard?: Record<string, unknown> }>(
        `${this.BASE}/dashboard`,
        { params }
      );
      return data?.dashboard || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch analytics dashboard: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get anomaly detection data
   * @param params - Query parameters
   */
  async getAnomalies(params: AnalyticsParams = {}): Promise<AnalyticsAnomaly[]> {
    try {
      const data = await http.get<{ anomalies?: AnalyticsAnomaly[] }>(
        `${this.BASE}/anomalies`,
        { params }
      );
      return data?.anomalies || [];
    } catch (err) {
      throw new Error(
        `Failed to fetch anomalies: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get forecast data
   * @param params - Query parameters
   */
  async getForecast(params: AnalyticsParams = {}): Promise<ForecastPoint[]> {
    try {
      const data = await http.get<{ forecast?: ForecastPoint[] }>(
        `${this.BASE}/forecast`,
        { params }
      );
      return data?.forecast || [];
    } catch (err) {
      throw new Error(
        `Failed to fetch forecast: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get seasonal patterns
   * @param params - Query parameters
   */
  async getSeasonalPatterns(params: AnalyticsParams = {}): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ patterns?: Record<string, unknown> }>(
        `${this.BASE}/seasonal-patterns`,
        { params }
      );
      return data?.patterns || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch seasonal patterns: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Drill down into specific analytics
   * @param params - Query parameters
   */
  async getDrillDown(params: AnalyticsParams = {}): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ drillDown?: Record<string, unknown> }>(
        `${this.BASE}/drill-down`,
        { params }
      );
      return data?.drillDown || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch drill-down data: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get seller analytics
   * @param params - Query parameters
   */
  async getSellerStats(params: AnalyticsParams = {}): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ seller?: Record<string, unknown> }>(
        `${this.BASE}/seller/stats`,
        { params }
      );
      return data?.seller || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch seller stats: ${AnalyticsService.reason(err, 'Unknown error')}`
      );
    }
  }
}

export const analyticsService = new AnalyticsService();
