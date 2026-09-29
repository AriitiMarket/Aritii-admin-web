/**
 * Frontend-safe environment configuration.
 * Only VITE_* variables are exposed to the browser bundle. Never read
 * secrets or backend credentials here.
 */
export interface AppEnv {
  apiGatewayUrl: string;
  appName: string;
  defaultLocale: string;
}

export const env: AppEnv = {
  apiGatewayUrl: (import.meta.env.VITE_API_GATEWAY_URL ?? '').replace(/\/+$/, ''),
  appName: import.meta.env.VITE_APP_NAME ?? 'Aritii Admin',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'en',
};

/** True when no API Gateway URL is configured (the app must not pretend to be live). */
export const hasConfiguredGateway = (): boolean => env.apiGatewayUrl.length > 0;
