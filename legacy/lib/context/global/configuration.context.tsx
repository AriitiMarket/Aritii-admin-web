'use client';

// Core
import React, { useCallback, useEffect, useState } from 'react';

// Interfaces§
import {
  IConfiguration,
  IConfigurationProviderProps,
} from '@/lib/utils/interfaces';

// API
import { configAPI } from '@/lib/api/api';

export const ConfigurationContext = React.createContext<
  IConfiguration | undefined
>({
  _id: '',
  pushToken: '',
  webClientID: '',
  publishableKey: '',
  clientId: '',
  googleApiKey: '',
  webAmplitudeApiKey: '',
  appAmplitudeApiKey: '',
  googleColor: '',
  webSentryUrl: '',
  apiSentryUrl: '',
  customerAppSentryUrl: '',
  restaurantAppSentryUrl: '',
  riderAppSentryUrl: '',
  skipEmailVerification: false,
  skipMobileVerification: false,
  skipWhatsAppOTP: false,
  currency: '',
  currencySymbol: '',
  deliveryRate: 0,
  googleMapLibraries: '',
  twilioEnabled: false,
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  twilioWhatsAppNumber: '',
  firebaseKey: '',
  appId: '',
  authDomain: '',
  storageBucket: '',
  msgSenderId: '',
  measurementId: '',
  projectId: '',
  dashboardSentryUrl: '',
  cloudinaryUploadUrl: '',
  cloudinaryApiKey: '',
  vapidKey: '',
  isPaidVersion: false,
  email: '',
  emailName: '',
  password: '',
  enableEmail: false,
  clientSecret: '',
  sandbox: false,
  secretKey: '',
  formEmail: '',
  sendGridApiKey: '',
  sendGridEnabled: false,
  sendGridEmail: '',
  sendGridEmailName: '',
  sendGridPassword: '',
  androidClientID: '',
  iOSClientID: '',
  expoClientID: '',
  termsAndConditions: '',
  privacyPolicy: '',
  testOtp: '',
  costType: '',
  enableCustomerDemoMode: false,
  customerDemoZoneId: '',
  enableRiderDemo: false,
  enableRestaurantDemo: false,
  enableAdminDemo: false,
});

export const ConfigurationProvider: React.FC<IConfigurationProviderProps> = ({
  children,
}) => {
  const [configuration, setConfiguration] = useState<
    IConfiguration | undefined
  >();
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState<Error | null>(null);

  // Handlers
  const fetchConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await configAPI.getConfiguration();
      setConfiguration(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use Effect
  useEffect(() => {
    fetchConfiguration();
  }, [fetchConfiguration]);

  return (
    <ConfigurationContext.Provider value={configuration}>
      {children}
    </ConfigurationContext.Provider>
  );
};
