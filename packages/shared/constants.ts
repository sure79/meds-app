export const APP_NAME = 'MEDS';
export const APP_FULL_NAME = 'Marine Electrical Design Suite';
export const APP_VERSION = '0.1.0';
export const API_BASE_URL = '/api';

// Standard generator sizes (kW)
export const STANDARD_GEN_SIZES = [100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1500, 2000];

// Standard breaker ratings (kA)
export const STANDARD_BREAKER_RATINGS = [10, 15, 20, 25, 35, 50, 65, 85, 100, 150];

// Cable sizes (mm²)
export const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];

// Starting current multiplier defaults
export const START_METHOD_DEFAULTS: Record<string, { multiplier: number; pf: number }> = {
  DOL: { multiplier: 6, pf: 0.3 },
  'Y-Delta': { multiplier: 2, pf: 0.4 },
  SoftStarter: { multiplier: 3, pf: 0.5 },
  VFD: { multiplier: 1.2, pf: 0.9 },
  None: { multiplier: 1, pf: 0.85 },
};

// Module navigation
export const MODULES = [
  { id: 'load-balance', name: 'Load Balance', nameKo: '전력균형', icon: 'BarChart3' },
  { id: 'sld', name: 'Single Line Diagram', nameKo: '단선결선도', icon: 'GitBranch' },
  { id: 'short-circuit', name: 'Short Circuit', nameKo: '단락전류', icon: 'Zap' },
  { id: 'voltage-drop', name: 'Voltage Drop', nameKo: '전압강하', icon: 'TrendingDown' },
  { id: 'protection', name: 'Protection', nameKo: '보호협조', icon: 'Shield' },
  { id: 'class-submit', name: 'Class Submission', nameKo: '선급제출', icon: 'ClipboardCheck' },
] as const;
