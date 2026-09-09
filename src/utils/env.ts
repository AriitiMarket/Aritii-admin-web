/**
 * Frontend-safe environment configuration.
 * Only VITE_* variables are exposed to the browser bundle. Never read
 * secrets or backend credentials here.
 */
export interface AppEnv {
  apiGatewayUrl: string;
  useMocks: boolean;
  appName: string;
  defaultLocale: string;
}

const readBool = (raw: string | undefined, fallback: boolean): boolean => {
  if (raw === undefined || raw === '') return fallback;
  return raw.toLowerCase() === 'true';
};

export const env: AppEnv = {
  apiGatewayUrl: (import.meta.env.VITE_API_GATEWAY_URL ?? '').replace(/\/+$/, ''),
  useMocks: readBool(import.meta.env.VITE_USE_MOCKS, true),
  appName: import.meta.env.VITE_APP_NAME ?? 'Ariiti Admin',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'en',
};

/** True when the app is explicitly configured to talk to the bundled mock backend. */
export const isMockMode = (): boolean => env.useMocks;

/** True when no API Gateway URL is configured (the app must not pretend to be live). */
export const hasConfiguredGateway = (): boolean => env.apiGatewayUrl.length > 0;