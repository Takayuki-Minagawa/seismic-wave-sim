export interface EarthquakePreset {
  id: string;
  nameKey: string;
  epicenterAngleDeg: number;
  depthKm: number;
  magnitudeM: number;
  observerAngles: number[];
}

export const PRESETS: EarthquakePreset[] = [
  {
    id: 'tohoku',
    nameKey: 'preset.tohoku',
    epicenterAngleDeg: 90,
    depthKm: 24,
    magnitudeM: 9.0,
    observerAngles: [30, 60, 90, 120, 150],
  },
  {
    id: 'sumatra',
    nameKey: 'preset.sumatra',
    epicenterAngleDeg: 90,
    depthKm: 30,
    magnitudeM: 9.1,
    observerAngles: [45, 90, 130, 160],
  },
  {
    id: 'chile',
    nameKey: 'preset.chile',
    epicenterAngleDeg: 90,
    depthKm: 35,
    magnitudeM: 9.5,
    observerAngles: [60, 110, 145, 170],
  },
];
