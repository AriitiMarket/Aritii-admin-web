/**
 * Map coordinate pipeline tests.
 *
 * Run with:  npm run test:map
 *
 * The helpers live in `src/pages/locations/workspace/mapGeo.ts`, which is
 * deliberately free of React/Leaflet so it can run headlessly. Because that
 * file carries a `@/` type-only import that a standalone `tsc` invocation
 * cannot resolve, this script strips the import, compiles the pure helpers,
 * and then exercises them.
 *
 * The fixtures below are the SAME coordinates the delivery-service seed writes
 * (services/delivery-service/src/seed/seed.js) — if the seed changes, update
 * these so the map stays verified against real data.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'src/pages/locations/workspace/mapGeo.ts');
const outDir = path.join(root, 'node_modules/.mapgeo');

mkdirSync(outDir, { recursive: true });
// Replace the `@/` type-only import with a local alias: types are erased at
// runtime, so inlining the shape keeps plain `tsc` happy without an alias map.
const inlineTypes = readFileSync(source, 'utf8').replace(
  /^import type \{ GeoPoint \} from '@\/services\/locations\.service';$/m,
  'type GeoPoint = { type: string; coordinates: number[] };'
);
writeFileSync(path.join(outDir, 'mapGeo.ts'), inlineTypes);
execFileSync(
  path.join(root, 'node_modules/.bin/tsc'),
  [path.join(outDir, 'mapGeo.ts'), '--outDir', outDir, '--target', 'es2020', '--module', 'es2020', '--skipLibCheck'],
  { stdio: 'ignore' }
);

const { toLatLng, indexMappable, routeEndpoints, zoneRadiusMetres } =
  await import(pathToFileURL(path.join(outDir, 'mapGeo.js')).href);

const point = (longitude, latitude) => ({ type: 'Point', coordinates: [longitude, latitude] });

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}` +
      (ok ? '' : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`)
  );
};

console.log('--- GeoJSON [lng,lat] -> Leaflet [lat,lng] ---');
check('Harar (seed 42.1256, 9.3125) swaps correctly', toLatLng(point(42.1256, 9.3125)), { lat: 9.3125, lng: 42.1256 });
check('Addis Ababa (seed 38.7525, 9.0192)', toLatLng(point(38.7525, 9.0192)), { lat: 9.0192, lng: 38.7525 });
check('latitude stays within -90..90 (axis not swapped)', toLatLng(point(42.1256, 9.3125)).lat <= 90, true);

console.log('\n--- invalid input is never plotted ---');
check('undefined -> null', toLatLng(undefined), null);
check('null -> null', toLatLng(null), null);
check('non-Point geometry -> null', toLatLng({ type: 'Polygon', coordinates: [1, 2] }), null);
check('non-numeric -> null', toLatLng({ type: 'Point', coordinates: ['a', 'b'] }), null);
check('empty array -> null', toLatLng({ type: 'Point', coordinates: [] }), null);

console.log('\n--- only mapped locations are indexed ---');
const points = indexMappable([
  { _id: 'ethiopia', coordinates: point(40.4897, 9.145) },
  { _id: 'hararghe', coordinates: point(42.0, 9.2) },
  { _id: 'addis', coordinates: point(38.7525, 9.0192) },
  { _id: 'harar', coordinates: point(42.1256, 9.3125) },
  { _id: 'ddCity', coordinates: point(41.8661, 9.5931) },
  { _id: 'kezira', coordinates: point(41.84, 9.57) },
  { _id: 'unmapped', coordinates: null },
]);
check('6 mapped locations indexed', points.size, 6);
check('unmapped location excluded', points.has('unmapped'), false);

console.log('\n--- routes require BOTH endpoints mapped ---');
check(
  'Harar -> Dire Dawa City draws',
  routeEndpoints({ originLocationId: 'harar', destinationLocationId: 'ddCity' }, points),
  { from: { lat: 9.3125, lng: 42.1256 }, to: { lat: 9.5931, lng: 41.8661 } }
);
check('route with unmapped origin skipped', routeEndpoints({ originLocationId: 'unmapped', destinationLocationId: 'harar' }, points), null);
check('route to unknown id skipped', routeEndpoints({ originLocationId: 'harar', destinationLocationId: 'ghost' }, points), null);

console.log('\n--- zone radius km -> metres ---');
check('Harar City Zone 12km', zoneRadiusMetres({ coverage: { radiusKm: 12 } }), 12000);
check('Harar Community Zone 6km', zoneRadiusMetres({ coverage: { radiusKm: 6 } }), 6000);
check('Dire Dawa Zone 15km', zoneRadiusMetres({ coverage: { radiusKm: 15 } }), 15000);
check('zone with no coverage', zoneRadiusMetres({}), 0);

console.log(`\n${failures === 0 ? 'ALL MAP GEO TESTS PASSED' : `${failures} FAILURE(S)`}`);
process.exit(failures ? 1 : 0);
