export interface EarthLayer {
  name: 'crust' | 'upperMantle' | 'lowerMantle' | 'outerCore' | 'innerCore';
  outerRadius: number; // km from Earth center
  innerRadius: number; // km from Earth center
  pVelocity: number;   // km/s
  sVelocity: number;   // km/s; 0 = S-wave absorbed (liquid)
  color: string;       // canvas fill color
  darkColor: string;   // dark mode canvas fill color
  density: number;     // g/cm³, informational
}

export type WaveType = 'P' | 'S';
export type WavePhase = 'P' | 'S' | 'PP' | 'PKP' | 'SKS';

export interface RaySegment {
  startRadius: number;
  endRadius: number;
  startAngle: number; // radians from source meridian
  endAngle: number;
  velocity: number;   // km/s
  waveType: WaveType;
  layerName: EarthLayer['name'];
  travelTime: number; // seconds for this segment
}

export interface Ray {
  id: string;
  takeoffAngleDeg: number;
  segments: RaySegment[];
  totalTravelTime: number;
  surfaceAngleDeg: number; // epicentral distance in degrees
  phase: WavePhase;
  isAbsorbed: boolean;
}

export interface WavefrontPoint {
  x: number; // canvas x
  y: number; // canvas y
  opacity: number;
}

export interface TravelTimeDatum {
  distanceDeg: number;
  timeSec: number;
  phase: WavePhase;
}

export interface ObserverArrival {
  phase: WavePhase;
  travelTimeSec: number;
  hasArrived: boolean;
}

export interface ObserverPoint {
  id: string;
  surfaceAngleDeg: number; // degrees clockwise from top (epicenter reference)
  label: string;
  arrivals: ObserverArrival[];
  inShadowZone: { P: boolean; S: boolean };
}

export interface EpicenterConfig {
  surfaceAngleDeg: number; // absolute angle on Earth circle (0–360°)
  depthKm: number;         // 0–700 km
  magnitudeM: number;      // 1–9
}

export interface ShadowZoneInfo {
  pShadowStart: number;  // degrees
  pShadowEnd: number;    // degrees
  sShadowStart: number;  // degrees
}

export interface SimulationState {
  epicenter: EpicenterConfig;
  observers: ObserverPoint[];
  rays: Ray[];
  travelTimeCurve: TravelTimeDatum[];
  shadowZone: ShadowZoneInfo;
  currentTimeSec: number;
  isPlaying: boolean;
  speedMultiplier: number;
  selectedObserverId: string | null;
}

export type SimulationAction =
  | { type: 'SET_EPICENTER'; epicenter: EpicenterConfig }
  | { type: 'ADD_OBSERVER'; angleDeg: number }
  | { type: 'REMOVE_OBSERVER'; id: string }
  | { type: 'SELECT_OBSERVER'; id: string | null }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'TICK'; dtSec: number }
  | { type: 'SET_SPEED'; multiplier: number }
  | { type: 'LOAD_PRESET'; epicenter: EpicenterConfig; observerAngles: number[] };
