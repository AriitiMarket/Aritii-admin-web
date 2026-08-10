import React, { createContext, useCallback, useEffect, useState } from 'react';
import { ILoginResponse, IOwnerSessionDataResponse } from '@/lib/utils/interfaces';
import {
  clearStoredSessionState,
  getAccessToken,
  getStoredUser,
  persistUserSession,
} from '@/lib/utils/methods/auth';
import { adminAPI } from '@/lib/api/api';

interface IUserContext {
  user: ILoginResponse | null;
  loading: boolean;
  isSessionVerified: boolean;
  setUser: (user: ILoginResponse | null) => void;
  clearUserSession: () => void;
  refreshUserSession: (
    cachedUser?: ILoginResponse | null
  ) => Promise<ILoginResponse | null>;
}

export const UserContext = createContext<IUserContext | undefined>(undefined);

const mergeRestaurants = (
  verifiedRestaurants: ILoginResponse['restaurants'] = [],
  cachedRestaurants: ILoginResponse['restaurants'] = []
) => {
  return verifiedRestaurants.map((restaurant) => {
    const cachedRestaurant = cachedRestaurants.find(
      (item) => item._id === restaurant._id
    );

    return {
      ...cachedRestaurant,
      ...restaurant,
    };
  });
};

const normalizeOwnerSession = (
  sessionUser: ILoginResponse,
  cachedUser: ILoginResponse | null
): ILoginResponse => ({
  ...cachedUser,
  ...sessionUser,
  permissions: sessionUser.permissions ?? [],
  restaurants: mergeRestaurants(
    sessionUser.restaurants ?? [],
    cachedUser?.restaurants ?? []
  ),
  shopType: cachedUser?.shopType ?? '',
});

const isAuthFailure = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: string }).message).toLowerCase();
    return message.includes('unauthenticated') || 
           message.includes('forbidden') || 
           message.includes('token') ||
           message.includes('expired');
  }
  return false;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<ILoginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  const clearUserSession = useCallback(() => {
    clearStoredSessionState();
    setUser(null);
    setIsSessionVerified(false);
  }, []);

  const refreshUserSession = useCallback(
    async (
      cachedUser: ILoginResponse | null = getStoredUser()
    ): Promise<ILoginResponse | null> => {
      const accessToken = getAccessToken() || cachedUser?.token;

      if (!accessToken) {
        clearUserSession();
        return null;
      }

      try {
        const response = await adminAPI.getAdminProfile();
        const sessionUser = response.data;

        if (!sessionUser) {
          clearUserSession();
          return null;
        }

        const verifiedUser = normalizeOwnerSession(sessionUser, cachedUser);
        persistUserSession(verifiedUser);
        setUser(verifiedUser);
        setIsSessionVerified(true);

        return verifiedUser;
      } catch (error) {
        if (isAuthFailure(error)) {
          clearUserSession();
        } else {
          setIsSessionVerified(false);
        }

        return null;
      }
    },
    [clearUserSession]
  );

  useEffect(() => {
    const cachedUser = getStoredUser();
    setUser(cachedUser);

    let isMounted = true;

    const bootstrapSession = async () => {
      await refreshUserSession(cachedUser);

      if (isMounted) {
        setLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [refreshUserSession]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isSessionVerified,
        setUser,
        clearUserSession,
        refreshUserSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
