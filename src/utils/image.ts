/**
 * Resolve an image reference from the API into a browser-loadable URL.
 *
 * Accepts both external `http(s)` links and real storage keys / local paths:
 *  - { url | public_id } objects
 *  - https:// / data: / blob:                 -> as-is
 *  - /uploads/x.png, /api/uploads/x.png       -> gateway uploads route
 *  - eshop/x.png, users/x.png, bare key.png   -> /api/uploads/<basename>
 *  - folder/key (Cloudinary public_id style)  -> try gateway uploads basename
 *
 * Uses VITE_API_GATEWAY_URL (e.g. "http://localhost:8000") as the gateway origin.
 */
import { env } from '@/utils/env';

const GATEWAY_ORIGIN = env.apiGatewayUrl || 'http://localhost:8000';

const apiJoin = (path: string): string =>
  `${GATEWAY_ORIGIN}/api/${String(path).replace(/^\/+/, '')}`;

export function resolveImageUrl(image: unknown): string | null {
  if (!image) return null;

  let raw: unknown = image;
  if (typeof image === 'object') {
    const obj = image as { url?: unknown; src?: unknown; public_id?: unknown };
    raw = obj.url || obj.src || obj.public_id;
  }
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const bare = value.replace(/^\/+/, '');

  if (bare === 'api' || bare.startsWith('api/')) {
    return `${GATEWAY_ORIGIN}/${bare}`;
  }

  if (bare.startsWith('app/uploads/')) {
    return apiJoin(`uploads/${bare.substring('app/uploads/'.length)}`);
  }

  const uploadsIdx = bare.indexOf('uploads/');
  if (uploadsIdx >= 0) {
    return apiJoin(`uploads/${bare.substring(uploadsIdx + 'uploads/'.length)}`);
  }

  const localKey = /^(eshop|users)\/(.+)$/i.exec(bare);
  if (localKey) {
    const base = localKey[2].split('/').pop();
    if (base) return apiJoin(`uploads/${base}`);
  }

  const hasImageExt = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(bare);

  // Bare or nested filename with an image extension -> assume an upload.
  if (!value.startsWith('/') && hasImageExt) {
    return apiJoin(`uploads/${bare}`);
  }

  // Folder-style key without extension (Cloudinary public_id) — still absolute.
  if (!value.startsWith('/') && bare.includes('/')) {
    return apiJoin(bare);
  }

  if (value.startsWith('/')) {
    return apiJoin(bare);
  }

  return null;
}
