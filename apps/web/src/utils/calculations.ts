import type { Load, OperatingCondition, Phase, VoltageLevel } from '../types';

/**
 * Calculate rated current from power parameters
 * I = P / (sqrt(3) * V * PF) for 3-phase
 * I = P / (V * PF) for 1-phase
 */
export function calculateRatedCurrent(
  kW: number,
  voltage: VoltageLevel | number,
  pf: number,
  phase: Phase
): number {
  if (phase === 3) {
    return (kW * 1000) / (Math.sqrt(3) * voltage * pf);
  }
  return (kW * 1000) / (voltage * pf);
}

/**
 * Calculate the actual power consumed by a load for a given operating condition
 * Considers load factor, diversity factor, efficiency
 */
export function calculateLoadPower(load: Load, condition: OperatingCondition): number {
  const lf = load.loadFactors.find(f => f.condition === condition);
  const factor = lf ? lf.factor : 0;
  return load.ratedPowerKW * factor * load.diversityFactor * load.quantity;
}

/**
 * Calculate apparent power (kVA) from real power
 */
export function calculateApparentPower(kW: number, pf: number): number {
  if (pf === 0) return 0;
  return kW / pf;
}

/**
 * Calculate reactive power (kVAR) from real and apparent power
 */
export function calculateReactivePower(kW: number, pf: number): number {
  const kVA = calculateApparentPower(kW, pf);
  return Math.sqrt(Math.max(0, kVA * kVA - kW * kW));
}

/**
 * Calculate starting current for a motor load
 */
export function calculateStartingCurrent(load: Load, voltage: VoltageLevel | number): number {
  const ratedCurrent = calculateRatedCurrent(
    load.ratedPowerKW / load.efficiency,
    voltage,
    load.ratedPF,
    load.phase
  );
  const multiplier = load.startingCurrentMultiplier || 1;
  return ratedCurrent * multiplier;
}

/**
 * Simple voltage drop calculation (approximate)
 * VD% = (I * L * (R*cos(phi) + X*sin(phi)) * 2) / (V * 10)
 * For 3-phase: multiply by sqrt(3) instead of 2
 */
export function calculateVoltageDropPercent(
  currentA: number,
  lengthM: number,
  resistanceOhmPerKm: number,
  reactanceOhmPerKm: number,
  pf: number,
  voltage: number,
  phase: Phase
): number {
  const sinPhi = Math.sqrt(1 - pf * pf);
  const lengthKm = lengthM / 1000;
  const drop = currentA * lengthKm * (resistanceOhmPerKm * pf + reactanceOhmPerKm * sinPhi);

  if (phase === 3) {
    return (Math.sqrt(3) * drop / voltage) * 100;
  }
  return (2 * drop / voltage) * 100;
}

/**
 * Format number with specified decimal places
 */
export function formatNumber(n: number, decimals: number = 1): string {
  return n.toFixed(decimals);
}

/**
 * Format power in appropriate unit
 */
export function formatPower(kW: number): string {
  if (kW >= 1000) {
    return `${(kW / 1000).toFixed(1)} MW`;
  }
  return `${kW.toFixed(1)} kW`;
}

/**
 * Get load type display label (Korean + English)
 */
export function getLoadTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'motor': '전동기 (Motor)',
    'heater': '히터 (Heater)',
    'lighting': '조명 (Lighting)',
    'transformer': '변압기 (Transformer)',
    'converter': '변환기 (Converter)',
    'ups': 'UPS',
    'battery-charger': '충전기 (Battery Charger)',
    'navigation': '항해장비 (Navigation)',
    'communication': '통신장비 (Communication)',
    'pump': '펌프 (Pump)',
    'fan': '팬 (Fan)',
    'compressor': '압축기 (Compressor)',
    'winch': '윈치 (Winch)',
    'crane': '크레인 (Crane)',
    'bow-thruster': '바우 스러스터 (Bow Thruster)',
    'hvac': '공조 (HVAC)',
    'galley': '조리실 (Galley)',
    'other': '기타 (Other)',
  };
  return labels[type] || type;
}

/**
 * Get operating condition display label
 */
export function getConditionLabel(condition: OperatingCondition): string {
  const labels: Record<OperatingCondition, string> = {
    'at-sea': '항해 (At Sea)',
    'maneuvering': '입출항 (Maneuvering)',
    'cargo-loading': '하역-적재 (Cargo Loading)',
    'cargo-unloading': '하역-양하 (Cargo Unloading)',
    'in-port': '정박 (In Port)',
    'emergency': '비상 (Emergency)',
    'anchor': '묘박 (Anchor)',
    'dynamic-positioning': 'DP 운전 (Dynamic Positioning)',
  };
  return labels[condition] || condition;
}

/**
 * Get condition short label
 */
export function getConditionShortLabel(condition: OperatingCondition): string {
  const labels: Record<OperatingCondition, string> = {
    'at-sea': '항해',
    'maneuvering': '입출항',
    'cargo-loading': '적재',
    'cargo-unloading': '양하',
    'in-port': '정박',
    'emergency': '비상',
    'anchor': '묘박',
    'dynamic-positioning': 'DP',
  };
  return labels[condition] || condition;
}

/**
 * Standard cable sizes (mm2)
 */
export const STANDARD_CABLE_SIZES = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630
];

/**
 * Cable ampacity table (approximate, 3-core XLPE in cable tray, 45C ambient)
 */
export const CABLE_DATA: Record<number, { ampacity3Core: number; ampacity1Core: number; resistance: number; reactance: number }> = {
  1.5:  { ampacity3Core: 16,   ampacity1Core: 22,   resistance: 15.1,  reactance: 0.118 },
  2.5:  { ampacity3Core: 22,   ampacity1Core: 30,   resistance: 9.08,  reactance: 0.109 },
  4:    { ampacity3Core: 30,   ampacity1Core: 40,   resistance: 5.68,  reactance: 0.101 },
  6:    { ampacity3Core: 37,   ampacity1Core: 51,   resistance: 3.78,  reactance: 0.0955 },
  10:   { ampacity3Core: 52,   ampacity1Core: 70,   resistance: 2.27,  reactance: 0.0884 },
  16:   { ampacity3Core: 70,   ampacity1Core: 94,   resistance: 1.41,  reactance: 0.0834 },
  25:   { ampacity3Core: 89,   ampacity1Core: 119,  resistance: 0.907, reactance: 0.0799 },
  35:   { ampacity3Core: 111,  ampacity1Core: 148,  resistance: 0.654, reactance: 0.0769 },
  50:   { ampacity3Core: 133,  ampacity1Core: 180,  resistance: 0.483, reactance: 0.0745 },
  70:   { ampacity3Core: 168,  ampacity1Core: 226,  resistance: 0.342, reactance: 0.0719 },
  95:   { ampacity3Core: 201,  ampacity1Core: 271,  resistance: 0.253, reactance: 0.0698 },
  120:  { ampacity3Core: 232,  ampacity1Core: 314,  resistance: 0.201, reactance: 0.0683 },
  150:  { ampacity3Core: 258,  ampacity1Core: 352,  resistance: 0.162, reactance: 0.0671 },
  185:  { ampacity3Core: 294,  ampacity1Core: 399,  resistance: 0.131, reactance: 0.0662 },
  240:  { ampacity3Core: 344,  ampacity1Core: 467,  resistance: 0.101, reactance: 0.0648 },
  300:  { ampacity3Core: 390,  ampacity1Core: 530,  resistance: 0.0813, reactance: 0.0636 },
  400:  { ampacity3Core: 445,  ampacity1Core: 609,  resistance: 0.0641, reactance: 0.0625 },
  500:  { ampacity3Core: 502,  ampacity1Core: 690,  resistance: 0.0514, reactance: 0.0616 },
  630:  { ampacity3Core: 560,  ampacity1Core: 775,  resistance: 0.0411, reactance: 0.0607 },
};

/**
 * Auto-select cable size based on rated current
 */
export function autoSelectCableSize(ratedCurrentA: number, phase: Phase): number {
  const key = phase === 3 ? 'ampacity3Core' : 'ampacity1Core';
  for (const size of STANDARD_CABLE_SIZES) {
    const data = CABLE_DATA[size];
    if (data && data[key] >= ratedCurrentA * 1.1) {
      return size;
    }
  }
  return 630; // largest available
}
