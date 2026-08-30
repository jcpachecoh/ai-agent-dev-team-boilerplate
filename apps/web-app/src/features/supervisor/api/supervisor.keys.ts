export const supervisorKeys = {
  all: ['supervisor'] as const,
  overview: () => [...supervisorKeys.all, 'overview'] as const,
  stations: () => [...supervisorKeys.all, 'stations'] as const,
  stationLive: (stationId: string) => [...supervisorKeys.all, 'station-live', stationId] as const,
};
