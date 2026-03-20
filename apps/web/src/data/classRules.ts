import type { ClassSociety } from '../types';

export interface ChecklistItem {
  id: string;
  category: string;
  document: string;
  description: string;
  module: 'load-balance' | 'diagram' | 'short-circuit' | 'voltage-drop' | 'protection' | 'class-submit' | 'general';
  required: boolean;
}

export const CLASS_SUBMISSION_CHECKLIST: Record<ClassSociety, ChecklistItem[]> = {
  KR: [
    { id: 'kr-01', category: '기본 도면', document: '전력 계통도 (Single Line Diagram)', description: '주배전반, 비상배전반 포함 전력 계통도', module: 'diagram', required: true },
    { id: 'kr-02', category: '기본 도면', document: '전력 부하 계산서 (Electric Load Analysis)', description: '각 운전 조건별 전력 부하 분석', module: 'load-balance', required: true },
    { id: 'kr-03', category: '기본 도면', document: '단락 전류 계산서 (Short Circuit Calculation)', description: '각 모선별 단락 전류 계산', module: 'short-circuit', required: true },
    { id: 'kr-04', category: '기본 도면', document: '전압 강하 계산서 (Voltage Drop Calculation)', description: '케이블 전압 강하 계산', module: 'voltage-drop', required: true },
    { id: 'kr-05', category: '기본 도면', document: '보호 협조 곡선 (Protection Coordination)', description: '과전류 보호 협조 분석', module: 'protection', required: true },
    { id: 'kr-06', category: '장비 목록', document: '발전기 사양서 (Generator Specification)', description: '발전기 용량, 전압, 리액턴스 등', module: 'general', required: true },
    { id: 'kr-07', category: '장비 목록', document: '배전반 사양서 (Switchboard Specification)', description: '배전반 구성, 차단기 사양', module: 'general', required: true },
    { id: 'kr-08', category: '장비 목록', document: '케이블 목록 (Cable Schedule)', description: '케이블 종류, 규격, 길이', module: 'voltage-drop', required: true },
    { id: 'kr-09', category: '비상 시스템', document: '비상 전원 계산서 (Emergency Power)', description: '비상 발전기 용량 검증', module: 'load-balance', required: true },
    { id: 'kr-10', category: '비상 시스템', document: '비상 전원 자동 절체 (Auto Transfer)', description: '비상 전원 자동 절체 시스템', module: 'diagram', required: true },
    { id: 'kr-11', category: '접지 시스템', document: '접지 계통도 (Grounding System)', description: '선체 접지 및 절연 감시', module: 'general', required: false },
    { id: 'kr-12', category: '시험 계획', document: '시운전 시험 절차서 (Test Procedure)', description: '전기 시스템 시운전 절차', module: 'general', required: false },
  ],
  ABS: [
    { id: 'abs-01', category: 'Basic Drawings', document: 'Single Line Diagram', description: 'Main and emergency power distribution diagram', module: 'diagram', required: true },
    { id: 'abs-02', category: 'Basic Drawings', document: 'Electric Load Analysis', description: 'Load analysis for all operating conditions per ABS Rules 4-8-2', module: 'load-balance', required: true },
    { id: 'abs-03', category: 'Calculations', document: 'Short Circuit Analysis', description: 'Fault current calculation per IEC 61363', module: 'short-circuit', required: true },
    { id: 'abs-04', category: 'Calculations', document: 'Voltage Drop Study', description: 'Running and starting voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'abs-05', category: 'Calculations', document: 'Protective Device Coordination', description: 'Time-current coordination study', module: 'protection', required: true },
    { id: 'abs-06', category: 'Equipment Data', document: 'Generator Data Sheets', description: 'Generator specifications including reactances', module: 'general', required: true },
    { id: 'abs-07', category: 'Equipment Data', document: 'Switchboard Arrangement', description: 'Switchboard layout and breaker schedule', module: 'general', required: true },
    { id: 'abs-08', category: 'Equipment Data', document: 'Cable Schedule', description: 'Complete cable schedule with sizing justification', module: 'voltage-drop', required: true },
    { id: 'abs-09', category: 'Emergency System', document: 'Emergency Power Analysis', description: 'Emergency generator sizing and load table', module: 'load-balance', required: true },
    { id: 'abs-10', category: 'Emergency System', document: 'Emergency Switchboard Diagram', description: 'ESB single line diagram with auto-transfer', module: 'diagram', required: true },
    { id: 'abs-11', category: 'Grounding', document: 'Grounding System Plan', description: 'Hull grounding and insulation monitoring', module: 'general', required: true },
    { id: 'abs-12', category: 'Testing', document: 'Commissioning Procedure', description: 'Electrical system commissioning and test plan', module: 'general', required: false },
  ],
  DNV: [
    { id: 'dnv-01', category: 'System Design', document: 'Power System Single Line Diagram', description: 'Complete power distribution per DNV Pt.4 Ch.8', module: 'diagram', required: true },
    { id: 'dnv-02', category: 'System Design', document: 'Electric Balance (Load Analysis)', description: 'Load balance for all operational modes', module: 'load-balance', required: true },
    { id: 'dnv-03', category: 'System Design', document: 'Short Circuit Study', description: 'Symmetrical and asymmetrical fault currents', module: 'short-circuit', required: true },
    { id: 'dnv-04', category: 'System Design', document: 'Voltage Drop Calculation', description: 'Steady-state and transient voltage drop', module: 'voltage-drop', required: true },
    { id: 'dnv-05', category: 'System Design', document: 'Selectivity Study', description: 'Protection coordination and selectivity analysis', module: 'protection', required: true },
    { id: 'dnv-06', category: 'Equipment', document: 'Generator Particulars', description: 'Generator data sheets with reactance values', module: 'general', required: true },
    { id: 'dnv-07', category: 'Equipment', document: 'Main Switchboard Design', description: 'MSB arrangement and breaker schedule', module: 'general', required: true },
    { id: 'dnv-08', category: 'Equipment', document: 'Cable Selection List', description: 'Cable types, sizes, and routing', module: 'voltage-drop', required: true },
    { id: 'dnv-09', category: 'Redundancy', document: 'Failure Mode Analysis', description: 'Single failure analysis per DNVGL-OS-D201', module: 'general', required: true },
    { id: 'dnv-10', category: 'Emergency', document: 'Emergency Power Calculation', description: 'Emergency generator sizing verification', module: 'load-balance', required: true },
    { id: 'dnv-11', category: 'Emergency', document: 'Emergency Switchboard Design', description: 'ESB configuration with auto-transfer', module: 'diagram', required: true },
    { id: 'dnv-12', category: 'Testing', document: 'FAT/SAT Procedures', description: 'Factory and site acceptance test procedures', module: 'general', required: false },
  ],
  LR: [
    { id: 'lr-01', category: 'Design', document: 'Single Line Diagram', description: 'Main power distribution diagram', module: 'diagram', required: true },
    { id: 'lr-02', category: 'Design', document: 'Load Balance', description: 'Electrical load analysis', module: 'load-balance', required: true },
    { id: 'lr-03', category: 'Calculations', document: 'Short Circuit', description: 'Fault current calculations', module: 'short-circuit', required: true },
    { id: 'lr-04', category: 'Calculations', document: 'Voltage Drop', description: 'Cable voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'lr-05', category: 'Calculations', document: 'Protection Coordination', description: 'Overcurrent protection coordination', module: 'protection', required: true },
  ],
  BV: [
    { id: 'bv-01', category: 'Design', document: 'Single Line Diagram', description: 'Power distribution diagram', module: 'diagram', required: true },
    { id: 'bv-02', category: 'Design', document: 'Load Balance', description: 'Electrical load analysis', module: 'load-balance', required: true },
    { id: 'bv-03', category: 'Calculations', document: 'Short Circuit', description: 'Fault current calculations', module: 'short-circuit', required: true },
    { id: 'bv-04', category: 'Calculations', document: 'Voltage Drop', description: 'Cable voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'bv-05', category: 'Calculations', document: 'Protection Coordination', description: 'Protection coordination study', module: 'protection', required: true },
  ],
  NK: [
    { id: 'nk-01', category: 'Design', document: 'Single Line Diagram', description: 'Power distribution diagram', module: 'diagram', required: true },
    { id: 'nk-02', category: 'Design', document: 'Load Balance', description: 'Electrical load analysis', module: 'load-balance', required: true },
    { id: 'nk-03', category: 'Calculations', document: 'Short Circuit', description: 'Fault current calculations', module: 'short-circuit', required: true },
    { id: 'nk-04', category: 'Calculations', document: 'Voltage Drop', description: 'Cable voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'nk-05', category: 'Calculations', document: 'Protection Coordination', description: 'Protection coordination study', module: 'protection', required: true },
  ],
  CCS: [
    { id: 'ccs-01', category: 'Design', document: 'Single Line Diagram', description: 'Power distribution diagram', module: 'diagram', required: true },
    { id: 'ccs-02', category: 'Design', document: 'Load Balance', description: 'Electrical load analysis', module: 'load-balance', required: true },
    { id: 'ccs-03', category: 'Calculations', document: 'Short Circuit', description: 'Fault current calculations', module: 'short-circuit', required: true },
    { id: 'ccs-04', category: 'Calculations', document: 'Voltage Drop', description: 'Cable voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'ccs-05', category: 'Calculations', document: 'Protection Coordination', description: 'Protection coordination study', module: 'protection', required: true },
  ],
  RINA: [
    { id: 'rina-01', category: 'Design', document: 'Single Line Diagram', description: 'Power distribution diagram', module: 'diagram', required: true },
    { id: 'rina-02', category: 'Design', document: 'Load Balance', description: 'Electrical load analysis', module: 'load-balance', required: true },
    { id: 'rina-03', category: 'Calculations', document: 'Short Circuit', description: 'Fault current calculations', module: 'short-circuit', required: true },
    { id: 'rina-04', category: 'Calculations', document: 'Voltage Drop', description: 'Cable voltage drop calculations', module: 'voltage-drop', required: true },
    { id: 'rina-05', category: 'Calculations', document: 'Protection Coordination', description: 'Protection coordination study', module: 'protection', required: true },
  ],
};
