import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { requestAppUpdate, type AppUpdateResponse } from '@/lib/apiClient';

type AvailableAppUpdate = AppUpdateResponse & {
  currentVersion: string;
};

type AppUpdateContextValue = {
  currentVersion: string;
  availableUpdate: AvailableAppUpdate | null;
  dismissUpdate: () => void;
};

const AppUpdateContext = createContext<AppUpdateContextValue | undefined>(undefined);

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, '');
}

function compareVersions(currentVersion: string, latestVersion: string) {
  const currentParts = normalizeVersion(currentVersion)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  const latestParts = normalizeVersion(latestVersion)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentParts[index] ?? 0;
    const latest = latestParts[index] ?? 0;

    if (latest > current) {
      return 1;
    }

    if (latest < current) {
      return -1;
    }
  }

  return 0;
}

export function AppUpdateProvider({ children }: PropsWithChildren) {
  const currentVersion = Constants.expoConfig?.version?.trim() || '0.0.0';
  const [availableUpdate, setAvailableUpdate] = useState<AvailableAppUpdate | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadUpdateInfo() {
      if (Platform.OS !== 'android') {
        setAvailableUpdate(null);
        return;
      }

      try {
        const response = await requestAppUpdate();
        const latestVersion = response.latestVersion.trim();

        if (!isMounted || !latestVersion) {
          return;
        }

        const hasNewVersion = compareVersions(currentVersion, latestVersion) < 0;

        if (!hasNewVersion) {
          setAvailableUpdate(null);
          return;
        }

        setAvailableUpdate({
          ...response,
          currentVersion,
        });
      } catch {
        if (isMounted) {
          setAvailableUpdate(null);
        }
      }
    }

    void loadUpdateInfo();

    return () => {
      isMounted = false;
    };
  }, [currentVersion]);

  const visibleUpdate =
    availableUpdate && availableUpdate.latestVersion !== dismissedVersion
      ? availableUpdate
      : null;

  const value = useMemo(
    () => ({
      currentVersion,
      availableUpdate: visibleUpdate,
      dismissUpdate: () => {
        if (visibleUpdate) {
          setDismissedVersion(visibleUpdate.latestVersion);
        }
      },
    }),
    [currentVersion, visibleUpdate]
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);

  if (!context) {
    throw new Error('useAppUpdate must be used within AppUpdateProvider');
  }

  return context;
}
