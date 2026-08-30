import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  GENERAL_LOCATION_TAB_ID,
  type LocationScope,
} from '@/features/auth/constants/location-session.constants';
import { getLocationIdFromToken, isAuthenticated, setGraphqlAuthToken } from '@/lib/auth-token';
import {
  persistActiveLocationId,
  persistLocationScope,
  readPersistedLocationId,
  readPersistedLocationScope,
} from '@/lib/location-session-storage';

import { fetchMyLocations, selectUserLocation } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import type { AssignedLocationSummary, LoginResponse } from '../types';

interface LocationSessionContextValue {
  assignedLocations: AssignedLocationSummary[];
  locationId: string | null;
  activeLocation: AssignedLocationSummary | null;
  activeTabId: string;
  isGeneralScope: boolean;
  requiresLocationSelection: boolean;
  isLoading: boolean;
  isSelecting: boolean;
  canOperate: boolean;
  showLocationTabs: boolean;
  applyAuthSession: (session: LoginResponse) => void;
  selectLocation: (locationId: string) => Promise<void>;
  selectTab: (tabId: string) => Promise<void>;
}

const LocationSessionContext = createContext<LocationSessionContextValue | null>(null);

function resolveLocationId(
  locations: AssignedLocationSummary[],
  sessionLocationId: string | null | undefined,
  requiresLocationSelection: boolean,
): string | null {
  const persistedId = readPersistedLocationId();
  const candidates = [sessionLocationId, persistedId].filter((value): value is string =>
    Boolean(value),
  );

  for (const candidate of candidates) {
    if (locations.some((location) => location.id === candidate)) {
      return candidate;
    }
  }

  if (requiresLocationSelection) return null;
  if (locations.length === 1) return locations[0]?.id ?? null;
  return sessionLocationId ?? null;
}

function resolveTabState(
  locations: AssignedLocationSummary[],
  resolvedLocationId: string | null,
): { activeTabId: string; isGeneralScope: boolean; scope: LocationScope } {
  if (locations.length <= 1) {
    const onlyLocationId = locations[0]?.id ?? GENERAL_LOCATION_TAB_ID;
    return {
      activeTabId: onlyLocationId,
      isGeneralScope: false,
      scope: 'location',
    };
  }

  const persistedScope = readPersistedLocationScope();
  if (persistedScope === 'location' && resolvedLocationId) {
    return {
      activeTabId: resolvedLocationId,
      isGeneralScope: false,
      scope: 'location',
    };
  }

  return {
    activeTabId: GENERAL_LOCATION_TAB_ID,
    isGeneralScope: true,
    scope: 'general',
  };
}

export function LocationSessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [assignedLocations, setAssignedLocations] = useState<AssignedLocationSummary[]>([]);
  const [locationId, setLocationId] = useState<string | null>(() => getLocationIdFromToken());
  const [activeTabId, setActiveTabId] = useState<string>(GENERAL_LOCATION_TAB_ID);
  const [isGeneralScope, setIsGeneralScope] = useState(true);
  const [requiresLocationSelection, setRequiresLocationSelection] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const locationsQuery = useQuery({
    queryKey: authKeys.myLocations(),
    queryFn: fetchMyLocations,
    // Skip refetch when login/signup already hydrated assignedLocations (avoids redundant GraphQL).
    enabled: isAuthenticated() && assignedLocations.length === 0,
    staleTime: 60_000,
  });

  const applySessionState = useCallback((session: LoginResponse) => {
    const resolvedLocationId = resolveLocationId(
      session.locations,
      session.locationId,
      session.requiresLocationSelection,
    );
    const tabState = resolveTabState(session.locations, resolvedLocationId);

    setAssignedLocations(session.locations);
    setLocationId(tabState.isGeneralScope ? null : resolvedLocationId);
    setActiveTabId(tabState.activeTabId);
    setIsGeneralScope(tabState.isGeneralScope);
    setRequiresLocationSelection(false);
    persistLocationScope(tabState.scope);
    persistActiveLocationId(tabState.isGeneralScope ? null : resolvedLocationId);
    setHydrated(true);
  }, []);

  const selectMutation = useMutation({
    mutationFn: selectUserLocation,
    onSuccess: (session) => {
      setGraphqlAuthToken(session.accessToken);
      applySessionState(session);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  const applyAuthSession = useCallback(
    (session: LoginResponse) => {
      applySessionState(session);
    },
    [applySessionState],
  );

  useEffect(() => {
    if (!locationsQuery.data || hydrated) return;

    const tokenLocationId = getLocationIdFromToken();
    const resolvedLocationId = resolveLocationId(
      locationsQuery.data,
      tokenLocationId,
      locationsQuery.data.length > 1 && !tokenLocationId,
    );
    const tabState = resolveTabState(locationsQuery.data, resolvedLocationId);

    setAssignedLocations(locationsQuery.data);
    setLocationId(tabState.isGeneralScope ? null : resolvedLocationId);
    setActiveTabId(tabState.activeTabId);
    setIsGeneralScope(tabState.isGeneralScope);
    setRequiresLocationSelection(false);
    persistLocationScope(tabState.scope);
    persistActiveLocationId(tabState.isGeneralScope ? null : resolvedLocationId);
    setHydrated(true);
  }, [hydrated, locationsQuery.data]);

  const selectLocation = useCallback(
    async (nextLocationId: string) => {
      await selectMutation.mutateAsync(nextLocationId);
    },
    [selectMutation],
  );

  const selectTab = useCallback(
    async (tabId: string) => {
      if (tabId === GENERAL_LOCATION_TAB_ID) {
        setActiveTabId(GENERAL_LOCATION_TAB_ID);
        setIsGeneralScope(true);
        setLocationId(null);
        setRequiresLocationSelection(false);
        persistLocationScope('general');
        persistActiveLocationId(null);
        return;
      }

      const location = assignedLocations.find((item) => item.id === tabId);
      if (!location) return;

      setActiveTabId(tabId);
      setIsGeneralScope(false);
      persistLocationScope('location');

      if (locationId === tabId && !isGeneralScope) {
        return;
      }

      await selectLocation(tabId);
    },
    [assignedLocations, isGeneralScope, locationId, selectLocation],
  );

  const activeLocation = useMemo(
    () => assignedLocations.find((location) => location.id === locationId) ?? null,
    [assignedLocations, locationId],
  );

  const canOperate = assignedLocations.length > 0;
  const showLocationTabs = assignedLocations.length > 1;

  const value = useMemo<LocationSessionContextValue>(
    () => ({
      assignedLocations,
      locationId,
      activeLocation,
      activeTabId,
      isGeneralScope,
      requiresLocationSelection,
      isLoading: locationsQuery.isPending && !hydrated,
      isSelecting: selectMutation.isPending,
      canOperate,
      showLocationTabs,
      applyAuthSession,
      selectLocation,
      selectTab,
    }),
    [
      assignedLocations,
      locationId,
      activeLocation,
      activeTabId,
      isGeneralScope,
      requiresLocationSelection,
      locationsQuery.isPending,
      hydrated,
      selectMutation.isPending,
      canOperate,
      showLocationTabs,
      applyAuthSession,
      selectLocation,
      selectTab,
    ],
  );

  return (
    <LocationSessionContext.Provider value={value}>{children}</LocationSessionContext.Provider>
  );
}

export function useLocationSession(): LocationSessionContextValue {
  const context = useContext(LocationSessionContext);
  if (!context) {
    throw new Error('useLocationSession must be used within LocationSessionProvider');
  }
  return context;
}

export function useActiveLocationId(): string | null {
  const { locationId, isGeneralScope } = useLocationSession();
  return isGeneralScope ? null : locationId;
}
