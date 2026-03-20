// Shared types between frontend and backend
// These mirror the Python Pydantic models

export type VoltageLevel = 220 | 380 | 440 | 450 | 480 | 690 | 720 | 6600 | 11000;
export type Frequency = 50 | 60;
export type Phase = 1 | 3;
export type GroundingSystem = 'IT' | 'TN-S' | 'TN-C' | 'TN-C-S' | 'TT';
export type ClassificationSociety = 'KR' | 'ABS' | 'DNV' | 'LR' | 'BV' | 'NK' | 'CCS';

export type OperatingCondition =
  | 'sea_going'
  | 'maneuvering'
  | 'port_loading'
  | 'port_idle'
  | 'emergency'
  | 'anchor'
  | 'dynamic_positioning'
  | 'special_1'
  | 'special_2';

export const CONDITION_LABELS: Record<OperatingCondition, string> = {
  sea_going: '항해 (Sea Going)',
  maneuvering: '입출항 (Maneuvering)',
  port_loading: '정박-하역 (Port Loading)',
  port_idle: '정박-무하역 (Port Idle)',
  emergency: '비상 (Emergency)',
  anchor: '묘박 (Anchor)',
  dynamic_positioning: 'DP 운전 (Dynamic Positioning)',
  special_1: '특수조건 1 (Special 1)',
  special_2: '특수조건 2 (Special 2)',
};

export const VOLTAGE_OPTIONS: VoltageLevel[] = [220, 380, 440, 450, 480, 690, 720, 6600, 11000];

export const CLASS_MARGINS: Record<ClassificationSociety, number> = {
  KR: 0.10,
  ABS: 0.10,
  DNV: 0.15,
  LR: 0.10,
  BV: 0.10,
  NK: 0.10,
  CCS: 0.10,
};
