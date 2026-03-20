// ============================================================
// MEDS Type System - Marine Electrical Design Suite
// ============================================================

// --- Enums & Literal Types ---

export type VoltageLevel = 440 | 450 | 480 | 690 | 3300 | 6600 | 11000;

export type Frequency = 50 | 60;

export type Phase = 1 | 3;

export type GroundingSystem = 'IT' | 'TN-S' | 'TN-C-S';

export type LoadType =
  | 'motor'
  | 'heater'
  | 'lighting'
  | 'transformer'
  | 'converter'
  | 'ups'
  | 'battery-charger'
  | 'navigation'
  | 'communication'
  | 'pump'
  | 'fan'
  | 'compressor'
  | 'winch'
  | 'crane'
  | 'bow-thruster'
  | 'hvac'
  | 'galley'
  | 'other';

export type StartMethod =
  | 'DOL'       // Direct On-Line
  | 'star-delta'
  | 'soft-starter'
  | 'VFD'       // Variable Frequency Drive
  | 'auto-transformer';

export type OperatingCondition =
  | 'at-sea'
  | 'maneuvering'
  | 'cargo-loading'
  | 'cargo-unloading'
  | 'in-port'
  | 'emergency'
  | 'anchor'
  | 'dynamic-positioning';

export type ClassSociety = 'KR' | 'ABS' | 'DNV' | 'LR' | 'BV' | 'NK' | 'CCS' | 'RINA';

export type CableType = 'XLPE' | 'EPR' | 'PVC' | 'TPYC' | 'DPYC';

export type InstalMethod = 'cable-tray' | 'conduit' | 'free-air' | 'bunched';

export type BreakerType = 'MCCB' | 'ACB' | 'VCB' | 'fuse';

export type GeneratorType = 'diesel' | 'shaft' | 'turbine' | 'emergency' | 'shore';

export type BusType = 'main' | 'emergency' | 'section' | 'distribution';

// --- Core Data Models ---

export interface Generator {
  id: string;
  name: string;
  type: GeneratorType;
  ratedPowerKW: number;
  ratedVoltage: VoltageLevel;
  ratedPF: number;
  frequency: Frequency;
  phase: Phase;
  xdPercent: number;        // subtransient reactance (%)
  xdPrimePercent: number;   // transient reactance (%)
  xdDoublePrimePercent: number; // sub-subtransient reactance (%)
  connectedBusId: string;
  breakerId?: string;
  isAvailable: boolean;
  rpm: number;
  efficiency: number;
}

export interface Bus {
  id: string;
  name: string;
  type: BusType;
  voltage: VoltageLevel;
  frequency: Frequency;
  phase: Phase;
  groundingSystem: GroundingSystem;
  connectedGeneratorIds: string[];
  connectedLoadIds: string[];
  connectedBusTieIds: string[];
  positionX: number;
  positionY: number;
}

export interface LoadFactor {
  condition: OperatingCondition;
  factor: number; // 0..1
}

export interface Load {
  id: string;
  name: string;
  type: LoadType;
  ratedPowerKW: number;
  ratedVoltage: VoltageLevel;
  ratedPF: number;
  efficiency: number;
  phase: Phase;
  connectedBusId: string;
  breakerId?: string;

  // Motor-specific
  startMethod?: StartMethod;
  startingCurrentMultiplier?: number; // e.g. 6 for DOL
  lockedRotorCurrentMultiplier?: number;
  startDurationSec?: number;

  // Operating condition load factors
  loadFactors: LoadFactor[];
  diversityFactor: number; // 0..1

  // Emergency
  isEssential: boolean;      // runs during emergency
  isEmergency: boolean;      // connected to emergency bus

  // Cable info
  cableLengthM: number;
  cableType: CableType;
  cableSizeMM2?: number;
  installMethod: InstalMethod;

  // Metadata
  quantity: number;
  description?: string;
  location?: string;
}

export interface CircuitBreaker {
  id: string;
  name: string;
  type: BreakerType;
  ratedCurrentA: number;
  ratedVoltage: VoltageLevel;
  breakingCapacityKA: number;
  tripCurve?: TripCurvePoint[];
  connectedFromId: string; // bus or generator id
  connectedToId: string;   // load or bus id
  isClosed: boolean;
}

export interface TripCurvePoint {
  currentMultiple: number;
  timeSec: number;
}

export interface CableSpec {
  sizeMM2: number;
  ampacity1Core: number;
  ampacity3Core: number;
  resistanceOhmPerKm: number;
  reactanceOhmPerKm: number;
  maxTempC: number;
}

export interface BusTie {
  id: string;
  name: string;
  busAId: string;
  busBId: string;
  breakerId?: string;
  isClosed: boolean;
}

// --- Project ---

export interface ProjectMeta {
  name: string;
  vesselName: string;
  vesselType: string;
  imoNumber?: string;
  classSociety: ClassSociety;
  classNotation?: string;
  designer: string;
  projectNumber: string;
  revision: string;
  date: string;
}

export interface Project {
  id: string;
  meta: ProjectMeta;
  systemVoltage: VoltageLevel;
  systemFrequency: Frequency;
  systemPhase: Phase;
  groundingSystem: GroundingSystem;
  generators: Generator[];
  buses: Bus[];
  loads: Load[];
  breakers: CircuitBreaker[];
  busTies: BusTie[];
  activeConditions: OperatingCondition[];
}

// --- Calculation Results ---

export interface LoadBalanceRow {
  loadId: string;
  loadName: string;
  ratedKW: number;
  conditions: Record<OperatingCondition, number>; // kW per condition
}

export interface LoadBalanceSummary {
  condition: OperatingCondition;
  totalRunningKW: number;
  totalConnectedKW: number;
  generatorCapacityKW: number;
  loadPercent: number;
  status: 'ok' | 'warning' | 'fail';
}

export interface LoadBalanceResult {
  rows: LoadBalanceRow[];
  summaries: LoadBalanceSummary[];
  busResults: Record<string, LoadBalanceSummary[]>;
}

export interface ShortCircuitBusResult {
  busId: string;
  busName: string;
  symmetricalKA: number;
  peakKA: number;
  breakingKA: number;
  cbRatingKA: number;
  status: 'ok' | 'warning' | 'fail';
  sources: {
    sourceId: string;
    sourceName: string;
    contributionKA: number;
  }[];
}

export interface ShortCircuitResult {
  busResults: ShortCircuitBusResult[];
  motorContribution: boolean;
  busTiesClosed: boolean;
}

export interface VoltageDropLoadResult {
  loadId: string;
  loadName: string;
  cableSizeMM2: number;
  cableLengthM: number;
  runningVDPercent: number;
  startingVDPercent: number;
  limitPercent: number;
  status: 'ok' | 'warning' | 'fail';
  recommendedSizeMM2?: number;
  ratedCurrentA: number;
  cableAmpacity: number;
}

export interface VoltageDropResult {
  loads: VoltageDropLoadResult[];
  ambientTempC: number;
  cableType: CableType;
}

// --- UI State Types ---

export type ModuleId =
  | 'welcome'
  | 'projects'
  | 'load-balance'
  | 'diagram'
  | 'short-circuit'
  | 'voltage-drop'
  | 'protection'
  | 'class-submit'
  | 'help';

export interface ProjectSummary {
  id: string;
  name: string;
  vesselName: string;
  classSociety: string;
  generatorCount: number;
  loadCount: number;
  updatedAt: string;
}

export interface AppState {
  activeModule: ModuleId;
  sidebarCollapsed: boolean;
  selectedItemId: string | null;
  selectedItemType: 'generator' | 'bus' | 'load' | 'breaker' | 'busTie' | null;
}

// --- Single Line Diagram (Panel Pages) ---

export interface PanelFeeder {
  id: string;
  panelPageId: string;
  mccbFrameA: number;
  mccbTripA: number;
  mccbType: 'MCCB' | 'ACB' | 'Fuse';
  instantTrip: boolean;
  protectionLabels: string[];
  cableType: string;
  cableCircuitNo: string;
  destinationType: 'load' | 'panel' | 'transformer' | 'spare';
  destinationId?: string;
  destinationLabel: string;
  remarks?: string;
}

export interface PanelPage {
  id: string;
  busId: string;
  title: string;
  pageNumber: number;
  feeders: PanelFeeder[];
}
