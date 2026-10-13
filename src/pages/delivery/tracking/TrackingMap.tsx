/**
 * Movement map for ONE delivery.
 *
 * Reads existing tracking data only — the same `location.coordinates` the events
 * already carry. There is deliberately NO way to write a coordinate from the
 * console: recording a ping is provider work (POST /delivery/tracking is
 * provider/admin-posted) and the admin console is read-only here.
 *
 * Only events that actually carry coordinates are plotted, so a delivery with no
 * pings reports that instead of drawing an empty map.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TrackingEvent } from '@/services/tracking.service';

type Point = [number, number]; // [lat, lng] for Leaflet

const valid = (c?: [number, number]): Point | null => {
  if (!c || c.length < 2) return null;
  const [lng, lat] = c;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
};

const startDot = () =>
  L.divIcon({
    className: '',
    html: '<span style="display:block;width:12px;height:12px;border-radius:9999px;background:#10B981;border:2px solid #fff;"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const endDot = () =>
  L.divIcon({
    className: '',
    html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,.25);"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export function TrackingMap({ events, height = 'h-[280px]' }: { events: TrackingEvent[]; height?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const points = events
    .map((e) => valid(e.location?.coordinates))
    .filter((p): p is Point => p !== null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(points[0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const path = L.polyline(points, { color: '#2563EB', weight: 3, opacity: 0.7 }).addTo(map);
    L.marker(points[0], { icon: startDot(), title: 'First recorded ping' }).addTo(map);
    L.marker(points[points.length - 1], { icon: endDot(), title: 'Latest recorded ping' }).addTo(map);

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(path.getBounds(), { padding: [30, 30] });
    }

    return () => {
      map.remove();
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-dark-600 dark:text-gray-400 ${height}`}>
        No coordinates have been recorded for this delivery yet.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-lg border border-gray-200 dark:border-dark-600 ${height}`}
      aria-label="Delivery movement map"
    />
  );
}
