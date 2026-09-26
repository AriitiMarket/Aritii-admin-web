// Network Map View Component
// Simple map visualization placeholder - can be enhanced with Leaflet/Mapbox when available

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface NetworkMapViewProps {
  locations: any[];
  zones: any[];
  routes: any[];
  onLocationClick?: (location: any) => void;
  onZoneClick?: (zone: any) => void;
  onRouteClick?: (route: any) => void;
}

interface MapLayer {
  id: string;
  label: string;
  enabled: boolean;
  color: string;
}

export function NetworkMapView({
  locations,
  zones,
  routes,
}: NetworkMapViewProps) {
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'locations', label: 'Locations', enabled: true, color: '#3B82F6' },
    { id: 'zones', label: 'Delivery Zones', enabled: true, color: '#10B981' },
    { id: 'routes', label: 'Routes', enabled: true, color: '#F59E0B' },
    { id: 'hubs', label: 'Hubs', enabled: false, color: '#8B5CF6' },
  ]);

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  const activeLayers = layers.filter((l) => l.enabled);

  return (
    <div className="space-y-4">
      {/* Layer Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Map Layers</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeLayers.length} active
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                layer.enabled
                  ? 'bg-primary-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              {layer.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Map Placeholder */}
      <Card className="p-8">
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
          {/* Simple grid visualization */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 p-4 opacity-20">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>

          {/* Layer indicators */}
          <div className="relative z-10 text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Network Map View
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              Interactive map visualization requires map library integration (Leaflet/Mapbox).
              Currently showing {activeLayers.length} layer{activeLayers.length !== 1 ? 's' : ''}.
            </p>

            {/* Layer summary */}
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {activeLayers.map((layer) => (
                <div key={layer.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {layer.label}: {layer.id === 'locations' ? locations.length : layer.id === 'zones' ? zones.length : routes.length}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm">
              Configure Map Provider
            </Button>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Legend</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Locations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Delivery Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Routes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Hubs</span>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{locations.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Locations</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{zones.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Zones</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{routes.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Routes</div>
        </Card>
      </div>
    </div>
  );
}