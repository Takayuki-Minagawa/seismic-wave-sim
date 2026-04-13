import { EarthLayer } from '../physics/types';
import { EARTH_RADIUS_KM } from '../physics/constants';

// 5-layer simplified velocity model
export const EARTH_LAYERS: EarthLayer[] = [
  {
    name: 'crust',
    outerRadius: EARTH_RADIUS_KM,
    innerRadius: EARTH_RADIUS_KM - 30,
    pVelocity: 6.0,
    sVelocity: 3.5,
    color: '#a8c86a',
    darkColor: '#7a9e45',
    density: 2.9,
  },
  {
    name: 'upperMantle',
    outerRadius: EARTH_RADIUS_KM - 30,
    innerRadius: EARTH_RADIUS_KM - 2900 + 2500, // ~3471+400 = outer at 6341, inner at 5971
    pVelocity: 8.0,
    sVelocity: 4.5,
    color: '#e8a04a',
    darkColor: '#c07830',
    density: 3.5,
  },
  {
    name: 'lowerMantle',
    outerRadius: EARTH_RADIUS_KM - 400,  // 5971 km
    innerRadius: EARTH_RADIUS_KM - 2900, // 3471 km
    pVelocity: 13.0,
    sVelocity: 7.0,
    color: '#c85a28',
    darkColor: '#a04020',
    density: 4.9,
  },
  {
    name: 'outerCore',
    outerRadius: EARTH_RADIUS_KM - 2900, // 3471 km
    innerRadius: EARTH_RADIUS_KM - 5150, // 1221 km
    pVelocity: 9.0,
    sVelocity: 0, // liquid — S-waves absorbed
    color: '#f0c020',
    darkColor: '#c09010',
    density: 10.9,
  },
  {
    name: 'innerCore',
    outerRadius: EARTH_RADIUS_KM - 5150, // 1221 km
    innerRadius: 0,
    pVelocity: 11.0,
    sVelocity: 3.5,
    color: '#f8e860',
    darkColor: '#d4c040',
    density: 13.0,
  },
];

export function getLayerAt(radiusKm: number): EarthLayer {
  for (const layer of EARTH_LAYERS) {
    if (radiusKm <= layer.outerRadius && radiusKm >= layer.innerRadius) {
      return layer;
    }
  }
  // Below inner core center — use innerCore
  return EARTH_LAYERS[EARTH_LAYERS.length - 1];
}

export function getVelocityAt(radiusKm: number, waveType: 'P' | 'S'): number {
  const layer = getLayerAt(radiusKm);
  return waveType === 'P' ? layer.pVelocity : layer.sVelocity;
}
