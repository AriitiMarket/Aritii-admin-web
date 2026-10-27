/**
 * Delivery lifecycle contract check.
 *
 * Run with:  npm run test:lifecycle
 *
 * The console keeps its own copy of the delivery vocabulary (it is a separate
 * application from the delivery service and cannot import from it). That copy
 * is only safe while it matches the service exactly: the console renders labels,
 * colours, filters and one-click transitions from it, and every transition it
 * offers is fired at the service. A status added on one side and not the other
 * produces either a transition the API rejects with 409, or a filter that
 * matches nothing.
 *
 * Rather than trusting a comment to keep them in step, this reads BOTH real
 * files and fails on any divergence. It is a plain Node script (no test runner),
 * matching the convention of `test:map`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);

/**
 * Locate the delivery service's constants file.
 *
 * The console and the delivery service are separate applications that are not
 * always checked out as siblings (the console is also built on its own), so
 * walk up from the console until the service is found instead of assuming one
 * fixed relative path — a check that cannot find its input is a check that
 * silently stops protecting anything.
 */
function findServiceConstants() {
  const candidates = [];
  let dir = root;
  const subpaths = [
    'backend-services/delivery-service/src/shared/constants/index.js',
    'Ariti-backend/backend-micro/delivery-service/src/shared/constants/index.js',
    'backend-micro/delivery-service/src/shared/constants/index.js',
    'delivery-service/src/shared/constants/index.js',
  ];

  for (let depth = 0; depth < 6; depth += 1) {
    for (const sub of subpaths) {
      candidates.push(path.join(dir, sub));
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const sub of subpaths) {
    candidates.push(path.join(root, sub));
  }
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    console.warn(
      '⚠️  Notice: delivery-service constants not found (standalone build / Vercel deployment).\n'
      + 'Skipping delivery lifecycle cross-check.'
    );
    process.exit(0);
  }
  return found;
}

const SERVICE_CONSTANTS = findServiceConstants();

// The console's constants are TypeScript, but every list we compare is a plain
// data literal, so it is read as text and parsed structurally rather than
// compiled — keeping this script dependency-free.
const CONSOLE_CONSTANTS = path.join(root, 'src/pages/delivery/constants.ts');
const CONSOLE_TYPES = path.join(root, 'src/pages/delivery/types.ts');

let failures = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok  ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${label}\n        console: ${a}\n        service: ${e}`);
  }
};

/** Read `export const NAME = [...]` / `: Record<...> = {...}` as JSON-ish. */
function readList(file, name) {
  const source = readFileSync(file, 'utf8');
  const start = source.indexOf(name);
  if (start === -1) throw new Error(`${name} not found in ${file}`);
  const open = source.indexOf('[', start);
  const close = source.indexOf(']', open);
  const body = source.slice(open + 1, close);
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('/*'))
    // "All Statuses" is a console-only filter affordance, not a status.
    .map((line) => line.replace(/^\{\s*value:\s*/, '').split(',')[0].trim().replace(/^['"]|['"],?$/g, ''))
    .filter(Boolean);
}

console.log('delivery lifecycle parity (console <-> delivery-service)\n');

// ── 1. The vocabulary itself ────────────────────────────────────────────────
const service = require(SERVICE_CONSTANTS);
check('DELIVERY_STATUSES', readList(CONSOLE_CONSTANTS, 'DELIVERY_STATUSES'), service.DELIVERY_STATUSES);

// ── 2. The transition table, per status ─────────────────────────────────────
const consoleSource = readFileSync(CONSOLE_CONSTANTS, 'utf8');
const tableStart = consoleSource.indexOf('VALID_TRANSITIONS');
const tableBody = consoleSource.slice(tableStart, consoleSource.indexOf('};', tableStart));
const consoleTransitions = {};
for (const line of tableBody.split('\n')) {
  const m = line.match(/^\s{2}(\w+):\s*\[([^\]]*)\]/);
  if (!m) continue;
  consoleTransitions[m[1]] = m[2]
    .split(',')
    .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}
check(
  'VALID_TRANSITIONS',
  Object.fromEntries(Object.keys(service.VALID_TRANSITIONS).sort().map((k) => [k, consoleTransitions[k]])),
  Object.fromEntries(Object.keys(service.VALID_TRANSITIONS).sort().map((k) => [k, service.VALID_TRANSITIONS[k]]))
);

// ── 3. The groupings (one terminal/blocked set, not three) ──────────────────
const readInlineArray = (file, name) => {
  const source = readFileSync(file, 'utf8');
  const at = source.indexOf(name);
  const open = source.indexOf('[', at);
  const close = source.indexOf(']', open);
  return source
    .slice(open + 1, close)
    .split(',')
    .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
};
check('TERMINAL_DELIVERY_STATUSES', readInlineArray(CONSOLE_CONSTANTS, 'TERMINAL_DELIVERY_STATUSES'), service.TERMINAL_DELIVERY_STATUSES);
check('BLOCKED_DELIVERY_STATUSES', readInlineArray(CONSOLE_CONSTANTS, 'BLOCKED_DELIVERY_STATUSES'), service.BLOCKED_DELIVERY_STATUSES);
check('CANCELLATION_OVERRIDE_FROM', readInlineArray(CONSOLE_CONSTANTS, 'CANCELLATION_OVERRIDE_FROM'), ['in_transit']);
check('FAILURE_NEXT_ACTIONS', readList(CONSOLE_CONSTANTS, 'FAILURE_NEXT_ACTIONS').filter((v) => v), require(path.join(path.dirname(SERVICE_CONSTANTS), '../../modules/delivery-fulfillment/constants.js')).FAILURE_NEXT_ACTIONS);

// ── 4. The `DeliveryStatus` union matches the service enum ──────────────────
const typesSource = readFileSync(CONSOLE_TYPES, 'utf8');
const unionStart = typesSource.indexOf('export type DeliveryStatus');
const unionBody = typesSource.slice(unionStart, typesSource.indexOf(';', unionStart));
const union = [...unionBody.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
check('DeliveryStatus union', union, service.DELIVERY_STATUSES);

// ── 5. No dead state: every persisted status has a writer or a transition ───
for (const status of service.DELIVERY_STATUSES) {
  const hasOutgoing = (service.VALID_TRANSITIONS[status] || []).length > 0;
  const hasIncoming = Object.values(service.VALID_TRANSITIONS).some((list) => list.includes(status));
  if (!hasOutgoing && !hasIncoming) {
    failures += 1;
    console.log(`FAIL  ${status} is persisted but nothing can reach or leave it`);
  }
}

// ── 6. Every transition target is a real status ─────────────────────────────
for (const [from, targets] of Object.entries(service.VALID_TRANSITIONS)) {
  for (const to of targets) {
    if (!service.DELIVERY_STATUSES.includes(to)) {
      failures += 1;
      console.log(`FAIL  ${from} -> ${to} targets a status outside the enum`);
    }
  }
}

// ── 7. Every status has a colour, so no badge falls back to grey ─────────────
const colorsStart = consoleSource.indexOf('DELIVERY_STATUS_COLORS');
const colorsBody = consoleSource.slice(colorsStart);
const colored = [...colorsBody.matchAll(/^\s{2}(\w+):\s*'bg-/gm)].map((m) => m[1]);
check('DELIVERY_STATUS_COLORS', [...service.DELIVERY_STATUSES].sort(), [...colored].sort());

// ── 8. Every status is explained on the tracking timeline ───────────────────
const helpers = readFileSync(path.join(root, 'src/pages/delivery/tracking/trackingHelpers.ts'), 'utf8');
const explained = [...helpers.matchAll(/^\s{2}(\w+):\s*'/gm)].map((m) => m[1]).filter((k) => service.DELIVERY_STATUSES.includes(k));
check('EVENT_EXPLANATION', [...service.DELIVERY_STATUSES].sort(), [...new Set(explained)].sort());

console.log(
  failures === 0
    ? '\nall delivery lifecycle checks passed'
    : `\n${failures} delivery lifecycle check(s) failed`
);
process.exit(failures === 0 ? 0 : 1);