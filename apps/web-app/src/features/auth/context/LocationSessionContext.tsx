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

import { getLocationIdFromToken, isAuthenticated, setGraphqlAuthToken } from '@/lib/auth-token';
import { persistActiveLocationId, readPersistedLocationId } from '@/lib/location-session-storage';

import { fetchMyLocations, selectUserLocation } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import type { AssignedLocationSummary, LoginResponse } from '../types';

interface LocationSessionContextValue {
  assignedLocations: AssignedLocationSummary[];
  locationId: string | null;
  activeLocation: AssignedLocationSummary | null;
  requiresLocationSelection: boolean;
  isLoading: boolean;
  isPickerOpen: boolean;
  isSelecting: boolean;
  canOperate: boolean;
  applyAuthSession: (session: LoginResponse) => void;
  selectLocation: (locationId: string) => Promise<void>;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
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

export function LocationSessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [assignedLocations, setAssignedLocations] = useState<AssignedLocationSummary[]>([]);
  const [locationId, setLocationId] = useState<string | null>(() => getLocationIdFromToken());
  const [requiresLocationSelection, setRequiresLocationSelection] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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

    setAssignedLocations(session.locations);
    setLocationId(resolvedLocationId);
    setRequiresLocationSelection(session.requiresLocationSelection && !resolvedLocationId);
    persistActiveLocationId(resolvedLocationId);
    setHydrated(true);
  }, []);

  const selectMutation = useMutation({
    mutationFn: selectUserLocation,
    onSuccess: (session) => {
      setGraphqlAuthToken(session.accessToken);
      applySessionState(session);
      setIsPickerOpen(false);
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

    setAssignedLocations(locationsQuery.data);
    setLocationId(resolvedLocationId);
    setRequiresLocationSelection(locationsQuery.data.length > 1 && !resolvedLocationId);
    if (resolvedLocationId) {
      persistActiveLocationId(resolvedLocationId);
    }
    setHydrated(true);
  }, [hydrated, locationsQuery.data]);

  const selectLocation = useCallback(
    async (nextLocationId: string) => {
      await selectMutation.mutateAsync(nextLocationId);
    },
    [selectMutation],
  );

  const activeLocation = useMemo(
    () => assignedLocations.find((location) => location.id === locationId) ?? null,
    [assignedLocations, locationId],
  );

  const canOperate =
    assignedLocations.length > 0 && Boolean(locationId) && !requiresLocationSelection;

  const value = useMemo<LocationSessionContextValue>(
    () => ({
      assignedLocations,
      locationId,
      activeLocation,
      requiresLocationSelection,
      isLoading: locationsQuery.isPending && !hydrated,
      isPickerOpen,
      isSelecting: selectMutation.isPending,
      canOperate,
      applyAuthSession,
      selectLocation,
      openLocationPicker: () => setIsPickerOpen(true),
      closeLocationPicker: () => setIsPickerOpen(false),
    }),
    [
      assignedLocations,
      locationId,
      activeLocation,
      requiresLocationSelection,
      locationsQuery.isPending,
      hydrated,
      isPickerOpen,
      selectMutation.isPending,
      canOperate,
      applyAuthSession,
      selectLocation,
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
  return useLocationSession().locationId;
}
