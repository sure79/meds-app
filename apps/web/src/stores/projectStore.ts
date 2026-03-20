import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Generator, Bus, Load, CircuitBreaker, BusTie,
  OperatingCondition, ModuleId, AppState,
  LoadBalanceResult, ShortCircuitResult, VoltageDropResult,
  VoltageLevel, Frequency, Phase, GroundingSystem, ClassSociety,
  LoadBalanceRow, LoadBalanceSummary,
  ProjectMeta, ProjectSummary,
  PanelPage, PanelFeeder,
} from '../types';
import { calculateLoadPower, calculateRatedCurrent } from '../utils/calculations';
import * as api from '../utils/api';
import { downloadFile } from '../utils/export';
import { dbSaveProject, dbDeleteProject, isTursoConfigured } from '../utils/db';

// ---- Default project with sample data ----

function createDefaultProject(): Project {
  const msbPortId = uuidv4();
  const msbStbdId = uuidv4();
  const esbId = uuidv4();
  const dg1Id = uuidv4();
  const dg2Id = uuidv4();
  const edgId = uuidv4();
  const bt1Id = uuidv4();

  const defaultConditions: OperatingCondition[] = ['at-sea', 'maneuvering', 'cargo-loading', 'cargo-unloading', 'in-port', 'emergency'];

  const generators: Generator[] = [
    {
      id: dg1Id, name: 'DG1 (주발전기 #1)', type: 'diesel',
      ratedPowerKW: 500, ratedVoltage: 440, ratedPF: 0.8, frequency: 60, phase: 3,
      xdPercent: 12, xdPrimePercent: 18, xdDoublePrimePercent: 25,
      connectedBusId: msbPortId, isAvailable: true, rpm: 1800, efficiency: 0.95,
    },
    {
      id: dg2Id, name: 'DG2 (주발전기 #2)', type: 'diesel',
      ratedPowerKW: 500, ratedVoltage: 440, ratedPF: 0.8, frequency: 60, phase: 3,
      xdPercent: 12, xdPrimePercent: 18, xdDoublePrimePercent: 25,
      connectedBusId: msbStbdId, isAvailable: true, rpm: 1800, efficiency: 0.95,
    },
    {
      id: edgId, name: 'EDG (비상발전기)', type: 'emergency',
      ratedPowerKW: 150, ratedVoltage: 440, ratedPF: 0.8, frequency: 60, phase: 3,
      xdPercent: 15, xdPrimePercent: 22, xdDoublePrimePercent: 30,
      connectedBusId: esbId, isAvailable: true, rpm: 1800, efficiency: 0.93,
    },
  ];

  const buses: Bus[] = [
    {
      id: msbPortId, name: 'MSB Port (주배전반 좌현)', type: 'main',
      voltage: 440, frequency: 60, phase: 3, groundingSystem: 'IT',
      connectedGeneratorIds: [dg1Id], connectedLoadIds: [], connectedBusTieIds: [bt1Id],
      positionX: 200, positionY: 220,
    },
    {
      id: msbStbdId, name: 'MSB Stbd (주배전반 우현)', type: 'main',
      voltage: 440, frequency: 60, phase: 3, groundingSystem: 'IT',
      connectedGeneratorIds: [dg2Id], connectedLoadIds: [], connectedBusTieIds: [bt1Id],
      positionX: 600, positionY: 220,
    },
    {
      id: esbId, name: 'ESB (비상배전반)', type: 'emergency',
      voltage: 440, frequency: 60, phase: 3, groundingSystem: 'IT',
      connectedGeneratorIds: [edgId], connectedLoadIds: [], connectedBusTieIds: [],
      positionX: 1000, positionY: 220,
    },
  ];

  const busTies: BusTie[] = [
    {
      id: bt1Id, name: 'BT1 (모선연결기)', busAId: msbPortId, busBId: msbStbdId, isClosed: true,
    },
  ];

  // Sample loads
  const sampleLoads: Load[] = [
    createSampleLoad('LO 펌프 (LO Pump)', 'pump', 15, 0.85, msbPortId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.5, 'emergency': 1.0 }),
    createSampleLoad('FW 냉각 펌프 (FW Cooling Pump)', 'pump', 22, 0.85, msbPortId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.5, 'emergency': 1.0 }),
    createSampleLoad('SW 냉각 펌프 (SW Cooling Pump)', 'pump', 30, 0.85, msbStbdId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.5, 'emergency': 1.0 }),
    createSampleLoad('밸러스트 펌프 (Ballast Pump)', 'pump', 55, 0.86, msbStbdId, defaultConditions, { 'maneuvering': 1.0, 'cargo-loading': 1.0, 'cargo-unloading': 1.0 }),
    createSampleLoad('기관실 통풍기 (ER Vent Fan)', 'fan', 37, 0.85, msbPortId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.5, 'emergency': 0.5 }),
    createSampleLoad('에어컨 (AC Unit)', 'hvac', 45, 0.85, msbStbdId, defaultConditions, { 'at-sea': 0.8, 'maneuvering': 0.8, 'in-port': 0.5 }),
    createSampleLoad('기관실 조명 (ER Lighting)', 'lighting', 8, 0.95, msbPortId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.8, 'emergency': 0.3 }),
    createSampleLoad('거주구 조명 (Accommodation Ltg)', 'lighting', 12, 0.95, msbStbdId, defaultConditions, { 'at-sea': 0.8, 'maneuvering': 0.8, 'in-port': 0.8, 'emergency': 0.2 }),
    createSampleLoad('항해등 (Navigation Lights)', 'lighting', 2, 0.95, esbId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'anchor': 1.0, 'emergency': 1.0 }),
    createSampleLoad('레이더 (Radar)', 'navigation', 3, 0.9, esbId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'emergency': 1.0 }),
    createSampleLoad('GMDSS', 'communication', 2, 0.9, esbId, defaultConditions, { 'at-sea': 1.0, 'maneuvering': 1.0, 'in-port': 0.5, 'emergency': 1.0 }),
    createSampleLoad('양묘기 (Windlass)', 'winch', 55, 0.8, msbPortId, defaultConditions, { 'maneuvering': 0.5, 'anchor': 1.0 }),
    createSampleLoad('소화 펌프 (Fire Pump)', 'pump', 45, 0.85, msbStbdId, defaultConditions, { 'emergency': 1.0 }),
  ];

  // Update bus connectedLoadIds
  for (const load of sampleLoads) {
    const bus = buses.find(b => b.id === load.connectedBusId);
    if (bus) bus.connectedLoadIds.push(load.id);
  }

  return {
    id: uuidv4(),
    meta: {
      name: '신규 프로젝트 (New Project)',
      vesselName: 'Sample Vessel',
      vesselType: 'Bulk Carrier',
      classSociety: 'KR',
      designer: '',
      projectNumber: 'MEDS-001',
      revision: 'A',
      date: new Date().toISOString().split('T')[0],
    },
    systemVoltage: 440,
    systemFrequency: 60,
    systemPhase: 3,
    groundingSystem: 'IT',
    generators,
    buses,
    loads: sampleLoads,
    breakers: [],
    busTies,
    activeConditions: defaultConditions,
  };
}

function createSampleLoad(
  name: string, type: string, kW: number, pf: number,
  busId: string, conditions: OperatingCondition[],
  factors: Partial<Record<OperatingCondition, number>>
): Load {
  const isMotor = ['pump', 'fan', 'compressor', 'winch', 'crane', 'bow-thruster', 'hvac'].includes(type);
  return {
    id: uuidv4(),
    name,
    type: type as Load['type'],
    ratedPowerKW: kW,
    ratedVoltage: 440,
    ratedPF: pf,
    efficiency: isMotor ? 0.88 : 0.95,
    phase: 3,
    connectedBusId: busId,
    startMethod: isMotor ? (kW > 20 ? 'star-delta' : 'DOL') : undefined,
    startingCurrentMultiplier: isMotor ? (kW > 20 ? 2.5 : 6) : undefined,
    startDurationSec: isMotor ? 5 : undefined,
    loadFactors: conditions.map(c => ({ condition: c, factor: factors[c] || 0 })),
    diversityFactor: 1.0,
    isEssential: !!factors['emergency'],
    isEmergency: false,
    cableLengthM: 30,
    cableType: 'XLPE',
    installMethod: 'cable-tray',
    quantity: 1,
  };
}

// ---- Store interface ----

interface ProjectStore {
  // State
  project: Project;
  ui: AppState;
  wizardStep: number;
  loadBalanceResult: LoadBalanceResult | null;
  shortCircuitResult: ShortCircuitResult | null;
  voltageDropResult: VoltageDropResult | null;
  isCalculating: boolean;
  error: string | null;
  projectList: ProjectSummary[];

  // Diagram custom positions (override auto-layout)
  diagramPositions: Record<string, { x: number; y: number }>;

  // Panel pages for SLD
  panelPages: PanelPage[];

  // UI Actions
  setActiveModule: (module: ModuleId) => void;
  toggleSidebar: () => void;
  selectItem: (id: string | null, type: AppState['selectedItemType']) => void;
  setWizardStep: (step: number) => void;

  // Diagram position actions
  setDiagramPosition: (id: string, x: number, y: number) => void;
  clearDiagramPositions: () => void;

  // Project metadata
  updateMeta: (meta: Partial<Project['meta']>) => void;
  updateSystemSettings: (settings: { systemVoltage?: VoltageLevel; systemFrequency?: Frequency; systemPhase?: Phase; groundingSystem?: GroundingSystem }) => void;
  setActiveConditions: (conditions: OperatingCondition[]) => void;

  // Project management
  newProject: (meta: ProjectMeta, vesselPreset?: string) => void;
  saveProjectToList: () => void;
  loadProjectFromList: (projectId: string) => void;
  deleteProjectFromList: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  getProjectList: () => ProjectSummary[];
  exportProjectFile: () => void;
  importProjectFile: (file: File) => Promise<void>;
  refreshProjectList: () => void;

  // Generator CRUD
  addGenerator: (gen: Omit<Generator, 'id'>) => void;
  updateGenerator: (id: string, updates: Partial<Generator>) => void;
  removeGenerator: (id: string) => void;

  // Bus CRUD
  addBus: (bus: Omit<Bus, 'id'>) => void;
  updateBus: (id: string, updates: Partial<Bus>) => void;
  removeBus: (id: string) => void;

  // Load CRUD
  addLoad: (load: Omit<Load, 'id'>) => void;
  updateLoad: (id: string, updates: Partial<Load>) => void;
  removeLoad: (id: string) => void;

  // Breaker CRUD
  addBreaker: (breaker: Omit<CircuitBreaker, 'id'>) => void;
  updateBreaker: (id: string, updates: Partial<CircuitBreaker>) => void;
  removeBreaker: (id: string) => void;

  // Bus Tie CRUD
  addBusTie: (bt: Omit<BusTie, 'id'>) => void;
  updateBusTie: (id: string, updates: Partial<BusTie>) => void;
  removeBusTie: (id: string) => void;

  // Panel Pages (SLD)
  addPanelPage: (busId: string, title: string) => void;
  addFeeder: (panelPageId: string, feeder: Omit<PanelFeeder, 'id'>) => void;
  updateFeeder: (feederId: string, updates: Partial<PanelFeeder>) => void;
  removeFeeder: (feederId: string) => void;
  removePanelPage: (panelPageId: string) => void;
  autoGeneratePanelPages: () => void;
  reorderFeeders: (panelPageId: string, feederIds: string[]) => void;

  // Calculations
  calculateLoadBalanceLocal: () => void;
  calculateLoadBalanceAPI: () => Promise<void>;
  calculateShortCircuitAPI: (motorContribution: boolean, busTiesClosed: boolean) => Promise<void>;
  calculateVoltageDropAPI: (ambientTempC: number, cableType: string) => Promise<void>;

  // Save/Load
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  loadProject: (project: Project) => void;
  resetProject: () => void;

  // Error handling
  clearError: () => void;
}

// ---- Helper: load project list from localStorage ----
function loadProjectListFromStorage(): ProjectSummary[] {
  try {
    const raw = localStorage.getItem('meds-projects');
    if (raw) {
      const projects: Project[] = JSON.parse(raw);
      return projects.map(p => ({
        id: p.id,
        name: p.meta.name,
        vesselName: p.meta.vesselName,
        classSociety: p.meta.classSociety,
        generatorCount: p.generators.length,
        loadCount: p.loads.length,
        updatedAt: p.meta.date,
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveProjectsToStorage(projects: Project[]): void {
  try {
    localStorage.setItem('meds-projects', JSON.stringify(projects));
  } catch { /* localStorage may be full */ }
}

function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem('meds-projects');
    if (raw) return JSON.parse(raw) as Project[];
  } catch { /* ignore */ }
  return [];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  ui: {
    activeModule: 'load-balance',
    sidebarCollapsed: false,
    selectedItemId: null,
    selectedItemType: null,
  },
  wizardStep: 1,
  loadBalanceResult: null,
  shortCircuitResult: null,
  voltageDropResult: null,
  isCalculating: false,
  error: null,
  projectList: loadProjectListFromStorage(),
  diagramPositions: {},
  panelPages: [],

  // ---- UI Actions ----
  setActiveModule: (module) => set((state) => ({
    ui: { ...state.ui, activeModule: module, selectedItemId: null, selectedItemType: null },
  })),

  toggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
  })),

  selectItem: (id, type) => set((state) => ({
    ui: { ...state.ui, selectedItemId: id, selectedItemType: type },
  })),

  setWizardStep: (step) => set({ wizardStep: step }),

  // ---- Diagram positions ----
  setDiagramPosition: (id, x, y) => set((state) => ({
    diagramPositions: { ...state.diagramPositions, [id]: { x, y } },
  })),

  clearDiagramPositions: () => set({ diagramPositions: {} }),

  // ---- Project metadata ----
  updateMeta: (meta) => set((state) => ({
    project: { ...state.project, meta: { ...state.project.meta, ...meta } },
  })),

  updateSystemSettings: (settings) => set((state) => ({
    project: { ...state.project, ...settings },
  })),

  setActiveConditions: (conditions) => set((state) => ({
    project: { ...state.project, activeConditions: conditions },
  })),

  // ---- Generator CRUD ----
  addGenerator: (gen) => {
    const id = uuidv4();
    set((state) => {
      const newGen = { ...gen, id };
      const buses = state.project.buses.map(b =>
        b.id === gen.connectedBusId
          ? { ...b, connectedGeneratorIds: [...b.connectedGeneratorIds, id] }
          : b
      );
      return {
        project: { ...state.project, generators: [...state.project.generators, newGen], buses },
      };
    });
  },

  updateGenerator: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      generators: state.project.generators.map(g => g.id === id ? { ...g, ...updates } : g),
    },
  })),

  removeGenerator: (id) => set((state) => {
    const buses = state.project.buses.map(b => ({
      ...b,
      connectedGeneratorIds: b.connectedGeneratorIds.filter(gid => gid !== id),
    }));
    return {
      project: {
        ...state.project,
        generators: state.project.generators.filter(g => g.id !== id),
        buses,
      },
    };
  }),

  // ---- Bus CRUD ----
  addBus: (bus) => {
    const id = uuidv4();
    set((state) => ({
      project: { ...state.project, buses: [...state.project.buses, { ...bus, id }] },
    }));
  },

  updateBus: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      buses: state.project.buses.map(b => b.id === id ? { ...b, ...updates } : b),
    },
  })),

  removeBus: (id) => set((state) => ({
    project: {
      ...state.project,
      buses: state.project.buses.filter(b => b.id !== id),
      loads: state.project.loads.filter(l => l.connectedBusId !== id),
      generators: state.project.generators.map(g =>
        g.connectedBusId === id ? { ...g, connectedBusId: '' } : g
      ),
    },
  })),

  // ---- Load CRUD ----
  addLoad: (load) => {
    const id = uuidv4();
    set((state) => {
      const newLoad = { ...load, id };
      const buses = state.project.buses.map(b =>
        b.id === load.connectedBusId
          ? { ...b, connectedLoadIds: [...b.connectedLoadIds, id] }
          : b
      );
      return {
        project: { ...state.project, loads: [...state.project.loads, newLoad], buses },
      };
    });
  },

  updateLoad: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      loads: state.project.loads.map(l => l.id === id ? { ...l, ...updates } : l),
    },
  })),

  removeLoad: (id) => set((state) => {
    const buses = state.project.buses.map(b => ({
      ...b,
      connectedLoadIds: b.connectedLoadIds.filter(lid => lid !== id),
    }));
    return {
      project: {
        ...state.project,
        loads: state.project.loads.filter(l => l.id !== id),
        buses,
      },
    };
  }),

  // ---- Breaker CRUD ----
  addBreaker: (breaker) => {
    const id = uuidv4();
    set((state) => ({
      project: { ...state.project, breakers: [...state.project.breakers, { ...breaker, id }] },
    }));
  },

  updateBreaker: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      breakers: state.project.breakers.map(b => b.id === id ? { ...b, ...updates } : b),
    },
  })),

  removeBreaker: (id) => set((state) => ({
    project: {
      ...state.project,
      breakers: state.project.breakers.filter(b => b.id !== id),
    },
  })),

  // ---- Bus Tie CRUD ----
  addBusTie: (bt) => {
    const id = uuidv4();
    set((state) => {
      const buses = state.project.buses.map(b => {
        if (b.id === bt.busAId || b.id === bt.busBId) {
          return { ...b, connectedBusTieIds: [...b.connectedBusTieIds, id] };
        }
        return b;
      });
      return {
        project: { ...state.project, busTies: [...state.project.busTies, { ...bt, id }], buses },
      };
    });
  },

  updateBusTie: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      busTies: state.project.busTies.map(bt => bt.id === id ? { ...bt, ...updates } : bt),
    },
  })),

  removeBusTie: (id) => set((state) => {
    const buses = state.project.buses.map(b => ({
      ...b,
      connectedBusTieIds: b.connectedBusTieIds.filter(btid => btid !== id),
    }));
    return {
      project: {
        ...state.project,
        busTies: state.project.busTies.filter(bt => bt.id !== id),
        buses,
      },
    };
  }),

  // ---- Panel Pages (SLD) ----
  addPanelPage: (busId, title) => {
    const id = uuidv4();
    set((state) => {
      const maxPage = state.panelPages
        .filter(p => p.busId === busId)
        .reduce((max, p) => Math.max(max, p.pageNumber), 0);
      const newPage: PanelPage = { id, busId, title, pageNumber: maxPage + 1, feeders: [] };
      return { panelPages: [...state.panelPages, newPage] };
    });
  },

  addFeeder: (panelPageId, feeder) => {
    const id = uuidv4();
    set((state) => ({
      panelPages: state.panelPages.map(pp =>
        pp.id === panelPageId
          ? { ...pp, feeders: [...pp.feeders, { ...feeder, id }] }
          : pp
      ),
    }));
  },

  updateFeeder: (feederId, updates) => {
    set((state) => ({
      panelPages: state.panelPages.map(pp => ({
        ...pp,
        feeders: pp.feeders.map(f =>
          f.id === feederId ? { ...f, ...updates } : f
        ),
      })),
    }));
  },

  removeFeeder: (feederId) => {
    set((state) => ({
      panelPages: state.panelPages.map(pp => ({
        ...pp,
        feeders: pp.feeders.filter(f => f.id !== feederId),
      })),
    }));
  },

  removePanelPage: (panelPageId) => {
    set((state) => ({
      panelPages: state.panelPages.filter(pp => pp.id !== panelPageId),
    }));
  },

  autoGeneratePanelPages: () => {
    const { project } = get();
    const standardFrames = [16, 25, 32, 50, 63, 100, 125, 160, 200, 250, 400, 630, 800, 1000, 1250, 1600];
    const standardTrips = [5, 6.3, 8, 10, 12.5, 15, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600];

    const isMotorType = (type: string) =>
      ['pump', 'fan', 'compressor', 'motor', 'winch', 'crane', 'bow-thruster', 'hvac'].includes(type);

    const calcCurrent = (load: Load) => {
      const kW = load.ratedPowerKW;
      const v = load.ratedVoltage;
      const pf = load.ratedPF;
      const eff = load.efficiency;
      if (load.phase === 3) return (kW * 1000) / (Math.sqrt(3) * v * pf * eff);
      return (kW * 1000) / (v * pf * eff);
    };

    const selectMCCB = (currentA: number) => {
      const frameRating = standardFrames.find(f => f >= currentA * 1.25) || standardFrames[standardFrames.length - 1];
      const tripTarget = currentA * 1.1;
      const tripRating = standardTrips.find(t => t >= tripTarget && t <= frameRating) || frameRating;
      return { frameRating, tripRating: Math.round(tripRating) };
    };

    const getProtections = (load: Load): string[] => {
      const prots: string[] = [];
      if (isMotorType(load.type)) {
        prots.push('SHT');
        if (load.ratedPowerKW > 20) prots.push('PT1');
        if (load.isEssential) prots.push('ES1');
      }
      return prots;
    };

    const panelPages: PanelPage[] = [];
    const feedersPerPage = 8;

    for (const bus of project.buses) {
      const loads = project.loads.filter(l => l.connectedBusId === bus.id);
      const totalPages = Math.max(1, Math.ceil(loads.length / feedersPerPage));

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageLoads = loads.slice(pageIdx * feedersPerPage, (pageIdx + 1) * feedersPerPage);
        const pageId = uuidv4();

        const feeders: PanelFeeder[] = pageLoads.map((load, i) => {
          const ratedCurrentA = calcCurrent(load);
          const { frameRating, tripRating } = selectMCCB(ratedCurrentA);
          const circuitNo = String(pageIdx * feedersPerPage + i + 1).padStart(2, '0');

          return {
            id: uuidv4(),
            panelPageId: pageId,
            mccbFrameA: frameRating,
            mccbTripA: tripRating,
            mccbType: frameRating >= 800 ? 'ACB' as const : 'MCCB' as const,
            instantTrip: !isMotorType(load.type),
            protectionLabels: getProtections(load),
            cableType: load.cableSizeMM2 ? `${load.cableType}-${load.cableSizeMM2}` : load.cableType,
            cableCircuitNo: circuitNo,
            destinationType: 'load' as const,
            destinationId: load.id,
            destinationLabel: load.name,
            remarks: load.startMethod || '',
          };
        });

        const busLabel = bus.name.split('(')[0].trim();
        panelPages.push({
          id: pageId,
          busId: bus.id,
          title: `${busLabel} AC${bus.voltage}V FEEDER PANEL`,
          pageNumber: pageIdx + 1,
          feeders,
        });
      }
    }

    set({ panelPages });
  },

  reorderFeeders: (panelPageId, feederIds) => {
    set((state) => ({
      panelPages: state.panelPages.map(pp => {
        if (pp.id !== panelPageId) return pp;
        const ordered = feederIds
          .map(fid => pp.feeders.find(f => f.id === fid))
          .filter((f): f is PanelFeeder => f !== undefined);
        return { ...pp, feeders: ordered };
      }),
    }));
  },

  // ---- Calculations ----
  calculateLoadBalanceLocal: () => {
    const { project } = get();
    const rows: LoadBalanceRow[] = project.loads.map(load => {
      const conditions: Record<string, number> = {};
      for (const cond of project.activeConditions) {
        conditions[cond] = calculateLoadPower(load, cond);
      }
      return {
        loadId: load.id,
        loadName: load.name,
        ratedKW: load.ratedPowerKW * load.quantity,
        conditions: conditions as Record<OperatingCondition, number>,
      };
    });

    const summaries: LoadBalanceSummary[] = project.activeConditions.map(cond => {
      const totalRunningKW = rows.reduce((sum, r) => sum + (r.conditions[cond] || 0), 0);
      const totalConnectedKW = project.loads.reduce((sum, l) => sum + l.ratedPowerKW * l.quantity, 0);

      // Calculate generator capacity for this condition
      let generatorCapacityKW = 0;
      if (cond === 'emergency') {
        // Emergency: only emergency generators
        generatorCapacityKW = project.generators
          .filter(g => g.type === 'emergency' && g.isAvailable)
          .reduce((sum, g) => sum + g.ratedPowerKW, 0);
      } else {
        // Normal: main generators (check bus tie status)
        generatorCapacityKW = project.generators
          .filter(g => g.type !== 'emergency' && g.isAvailable)
          .reduce((sum, g) => sum + g.ratedPowerKW, 0);
      }

      const loadPercent = generatorCapacityKW > 0 ? (totalRunningKW / generatorCapacityKW) * 100 : 0;
      const status: 'ok' | 'warning' | 'fail' =
        loadPercent > 100 ? 'fail' :
        loadPercent > 80 ? 'warning' : 'ok';

      return {
        condition: cond,
        totalRunningKW,
        totalConnectedKW,
        generatorCapacityKW,
        loadPercent,
        status,
      };
    });

    set({ loadBalanceResult: { rows, summaries, busResults: {} } });
  },

  calculateLoadBalanceAPI: async () => {
    const { project } = get();
    set({ isCalculating: true, error: null });
    try {
      const result = await api.calculateLoadBalance(project);
      set({ loadBalanceResult: result, isCalculating: false });
    } catch (err) {
      // Fall back to local calculation
      get().calculateLoadBalanceLocal();
      set({ isCalculating: false, error: 'API unavailable - using local calculation' });
    }
  },

  calculateShortCircuitAPI: async (motorContribution, busTiesClosed) => {
    const { project } = get();
    set({ isCalculating: true, error: null });
    try {
      const result = await api.calculateShortCircuit(project, { motorContribution, busTiesClosed });
      set({ shortCircuitResult: result, isCalculating: false });
    } catch (err) {
      // Local short circuit estimation
      const busResults = project.buses.map(bus => {
        const connectedGens = project.generators.filter(g => {
          if (g.connectedBusId === bus.id) return true;
          if (busTiesClosed) {
            return project.busTies.some(bt =>
              bt.isClosed && (
                (bt.busAId === bus.id && project.generators.some(gg => gg.connectedBusId === bt.busBId && gg.id === g.id)) ||
                (bt.busBId === bus.id && project.generators.some(gg => gg.connectedBusId === bt.busAId && gg.id === g.id))
              )
            );
          }
          return false;
        });

        let totalSymKA = 0;
        const sources = connectedGens.map(g => {
          const ratedCurrentA = calculateRatedCurrent(g.ratedPowerKW, g.ratedVoltage, g.ratedPF, g.phase);
          const isc = (ratedCurrentA / (g.xdPercent / 100)) / 1000;
          totalSymKA += isc;
          return { sourceId: g.id, sourceName: g.name, contributionKA: Number(isc.toFixed(2)) };
        });

        if (motorContribution) {
          const motorLoads = project.loads.filter(l =>
            l.connectedBusId === bus.id &&
            ['pump', 'fan', 'compressor', 'winch', 'crane', 'bow-thruster', 'hvac', 'motor'].includes(l.type)
          );
          const motorContrib = motorLoads.reduce((sum, l) => {
            const ratedI = calculateRatedCurrent(l.ratedPowerKW / l.efficiency, l.ratedVoltage, l.ratedPF, l.phase);
            return sum + (ratedI * 4) / 1000; // typical motor contribution ~4x rated
          }, 0);
          if (motorContrib > 0) {
            totalSymKA += motorContrib;
            sources.push({ sourceId: 'motors', sourceName: '전동기 기여 (Motor contrib.)', contributionKA: Number(motorContrib.toFixed(2)) });
          }
        }

        const peakKA = totalSymKA * 1.8;
        const breakingKA = totalSymKA * 0.9;
        const cbRatingKA = Math.max(...project.breakers
          .filter(b => b.connectedFromId === bus.id || b.connectedToId === bus.id)
          .map(b => b.breakingCapacityKA), 0) || totalSymKA * 1.5;

        return {
          busId: bus.id,
          busName: bus.name,
          symmetricalKA: Number(totalSymKA.toFixed(2)),
          peakKA: Number(peakKA.toFixed(2)),
          breakingKA: Number(breakingKA.toFixed(2)),
          cbRatingKA: Number(cbRatingKA.toFixed(2)),
          status: (peakKA > cbRatingKA ? 'fail' : peakKA > cbRatingKA * 0.8 ? 'warning' : 'ok') as 'ok' | 'warning' | 'fail',
          sources,
        };
      });

      set({
        shortCircuitResult: { busResults, motorContribution, busTiesClosed },
        isCalculating: false,
        error: 'API unavailable - using local estimation',
      });
    }
  },

  calculateVoltageDropAPI: async (ambientTempC, cableType) => {
    const { project } = get();
    set({ isCalculating: true, error: null });
    try {
      const result = await api.calculateVoltageDrop(project, { ambientTempC, cableType: cableType as any });
      set({ voltageDropResult: result, isCalculating: false });
    } catch (err) {
      // Local estimation
      const { CABLE_DATA, autoSelectCableSize } = await import('../utils/calculations');
      const loads = project.loads.map(load => {
        const ratedCurrentA = calculateRatedCurrent(
          load.ratedPowerKW / load.efficiency,
          load.ratedVoltage,
          load.ratedPF,
          load.phase
        );
        const cableSizeMM2 = load.cableSizeMM2 || autoSelectCableSize(ratedCurrentA, load.phase);
        const cableData = CABLE_DATA[cableSizeMM2];
        const resistance = cableData?.resistance || 1;
        const reactance = cableData?.reactance || 0.08;
        const ampacity = load.phase === 3 ? (cableData?.ampacity3Core || 100) : (cableData?.ampacity1Core || 130);

        const sinPhi = Math.sqrt(1 - load.ratedPF * load.ratedPF);
        const lengthKm = load.cableLengthM / 1000;
        const vdRun = load.phase === 3
          ? (Math.sqrt(3) * ratedCurrentA * lengthKm * (resistance * load.ratedPF + reactance * sinPhi) / load.ratedVoltage) * 100
          : (2 * ratedCurrentA * lengthKm * (resistance * load.ratedPF + reactance * sinPhi) / load.ratedVoltage) * 100;

        const startMultiplier = load.startingCurrentMultiplier || 1;
        const vdStart = vdRun * startMultiplier;
        const limitPercent = startMultiplier > 1 ? 15 : 5;

        const status: 'ok' | 'warning' | 'fail' =
          (vdRun > 5 || vdStart > 15) ? 'fail' :
          (vdRun > 3 || vdStart > 10) ? 'warning' : 'ok';

        let recommendedSizeMM2: number | undefined;
        if (status !== 'ok') {
          for (const size of [cableSizeMM2 * 1.5, cableSizeMM2 * 2, cableSizeMM2 * 3]) {
            const nextSize = autoSelectCableSize(ratedCurrentA, load.phase);
            if (nextSize > cableSizeMM2) {
              recommendedSizeMM2 = nextSize;
              break;
            }
          }
        }

        return {
          loadId: load.id,
          loadName: load.name,
          cableSizeMM2,
          cableLengthM: load.cableLengthM,
          runningVDPercent: Number(vdRun.toFixed(2)),
          startingVDPercent: Number(vdStart.toFixed(2)),
          limitPercent,
          status,
          recommendedSizeMM2,
          ratedCurrentA: Number(ratedCurrentA.toFixed(1)),
          cableAmpacity: ampacity,
        };
      });

      set({
        voltageDropResult: { loads, ambientTempC, cableType: cableType as any },
        isCalculating: false,
        error: 'API unavailable - using local estimation',
      });
    }
  },

  // ---- Save/Load ----
  saveToLocalStorage: () => {
    const { project, diagramPositions, panelPages } = get();
    try {
      localStorage.setItem('meds-project', JSON.stringify(project));
      localStorage.setItem('meds-diagram-positions', JSON.stringify(diagramPositions));
      localStorage.setItem('meds-panel-pages', JSON.stringify(panelPages));
    } catch {
      // localStorage may be full or disabled
    }
  },

  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem('meds-project');
      if (saved) {
        const project = JSON.parse(saved) as Project;
        let diagramPositions: Record<string, { x: number; y: number }> = {};
        const savedPositions = localStorage.getItem('meds-diagram-positions');
        if (savedPositions) {
          diagramPositions = JSON.parse(savedPositions);
        }
        let panelPages: PanelPage[] = [];
        const savedPanelPages = localStorage.getItem('meds-panel-pages');
        if (savedPanelPages) {
          panelPages = JSON.parse(savedPanelPages);
        }
        set({ project, diagramPositions, panelPages, loadBalanceResult: null, shortCircuitResult: null, voltageDropResult: null });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  loadProject: (project) => {
    set({ project, loadBalanceResult: null, shortCircuitResult: null, voltageDropResult: null, error: null });
  },

  resetProject: () => {
    set({
      project: createDefaultProject(),
      loadBalanceResult: null,
      shortCircuitResult: null,
      voltageDropResult: null,
      error: null,
    });
  },

  // ---- Project Management ----
  newProject: (meta, vesselPreset) => {
    const newProj: Project = {
      id: uuidv4(),
      meta: { ...meta, date: new Date().toISOString().split('T')[0] },
      systemVoltage: 440,
      systemFrequency: 60,
      systemPhase: 3,
      groundingSystem: 'IT',
      generators: [],
      buses: [],
      loads: [],
      breakers: [],
      busTies: [],
      activeConditions: ['at-sea', 'maneuvering', 'cargo-loading', 'cargo-unloading', 'in-port', 'emergency'],
    };

    if (vesselPreset) {
      // Dynamically apply vessel preset
      import('../data/loadPresets').then(({ VESSEL_PRESETS, COMMON_MARINE_LOADS }) => {
        const preset = VESSEL_PRESETS.find(p => p.vesselType === vesselPreset);
        if (!preset) {
          set({ project: newProj, loadBalanceResult: null, shortCircuitResult: null, voltageDropResult: null, diagramPositions: {} });
          return;
        }

        // Create buses
        const busMap: Record<string, string> = {};
        const buses: Bus[] = preset.buses.map((b, i) => {
          const id = uuidv4();
          busMap[b.name] = id;
          return {
            id,
            name: b.name,
            type: b.type,
            voltage: newProj.systemVoltage,
            frequency: newProj.systemFrequency,
            phase: newProj.systemPhase,
            groundingSystem: newProj.groundingSystem,
            connectedGeneratorIds: [],
            connectedLoadIds: [],
            connectedBusTieIds: [],
            positionX: 200 + i * 400,
            positionY: 220,
          };
        });

        // Create generators
        const generators: Generator[] = preset.generators.map(g => {
          const id = uuidv4();
          const busId = busMap[g.busName] || buses[0]?.id || '';
          const bus = buses.find(b => b.id === busId);
          if (bus) bus.connectedGeneratorIds.push(id);
          return {
            id,
            name: g.name,
            type: g.type,
            ratedPowerKW: g.ratedPowerKW,
            ratedVoltage: newProj.systemVoltage,
            ratedPF: 0.8,
            frequency: newProj.systemFrequency,
            phase: newProj.systemPhase,
            xdPercent: g.type === 'emergency' ? 15 : 12,
            xdPrimePercent: g.type === 'emergency' ? 22 : 18,
            xdDoublePrimePercent: g.type === 'emergency' ? 30 : 25,
            connectedBusId: busId,
            isAvailable: true,
            rpm: 1800,
            efficiency: g.type === 'emergency' ? 0.93 : 0.95,
          };
        });

        // Create bus ties
        const busTies: BusTie[] = preset.busTies.map(bt => {
          const id = uuidv4();
          const busAId = busMap[bt.busAName] || '';
          const busBId = busMap[bt.busBName] || '';
          const busA = buses.find(b => b.id === busAId);
          const busB = buses.find(b => b.id === busBId);
          if (busA) busA.connectedBusTieIds.push(id);
          if (busB) busB.connectedBusTieIds.push(id);
          return { id, name: bt.name, busAId, busBId, isClosed: true };
        });

        // Create loads from preset load names
        const mainBuses = buses.filter(b => b.type === 'main');
        const esbBus = buses.find(b => b.type === 'emergency');
        let loadBusIdx = 0;

        const loads: Load[] = preset.loadNames.map(loadName => {
          const presetLoad = COMMON_MARINE_LOADS.find(l => l.name === loadName);
          if (!presetLoad) return null;

          const isEmergencyLoad = presetLoad.isEssential && esbBus && presetLoad.defaultFactors['emergency'];
          const connectedBusId = isEmergencyLoad && esbBus
            ? esbBus.id
            : mainBuses.length > 0
              ? mainBuses[loadBusIdx++ % mainBuses.length].id
              : buses[0]?.id || '';

          const id = uuidv4();
          const bus = buses.find(b => b.id === connectedBusId);
          if (bus) bus.connectedLoadIds.push(id);

          return {
            id,
            name: presetLoad.name,
            type: presetLoad.type,
            ratedPowerKW: presetLoad.ratedPowerKW,
            ratedVoltage: newProj.systemVoltage,
            ratedPF: presetLoad.ratedPF,
            efficiency: presetLoad.efficiency,
            phase: presetLoad.phase,
            connectedBusId,
            startMethod: presetLoad.startMethod,
            startingCurrentMultiplier: presetLoad.startingCurrentMultiplier,
            startDurationSec: presetLoad.startMethod ? 5 : undefined,
            loadFactors: newProj.activeConditions.map(c => ({
              condition: c,
              factor: presetLoad.defaultFactors[c] || 0,
            })),
            diversityFactor: 1.0,
            isEssential: presetLoad.isEssential,
            isEmergency: !!(isEmergencyLoad && esbBus),
            cableLengthM: 30,
            cableType: presetLoad.cableType,
            installMethod: presetLoad.installMethod,
            quantity: 1,
          } as Load;
        }).filter((l): l is Load => l !== null);

        const projectWithPreset: Project = {
          ...newProj,
          generators,
          buses,
          loads,
          busTies,
        };

        set({
          project: projectWithPreset,
          loadBalanceResult: null,
          shortCircuitResult: null,
          voltageDropResult: null,
          diagramPositions: {},
        });

        // Auto-save to active project
        try {
          localStorage.setItem('meds-active-project', projectWithPreset.id);
        } catch { /* ignore */ }
      });
    } else {
      set({
        project: newProj,
        loadBalanceResult: null,
        shortCircuitResult: null,
        voltageDropResult: null,
        diagramPositions: {},
      });
      try {
        localStorage.setItem('meds-active-project', newProj.id);
      } catch { /* ignore */ }
    }
  },

  saveProjectToList: () => {
    const { project } = get();
    const stored = getStoredProjects();
    const idx = stored.findIndex(p => p.id === project.id);
    const updatedProject = {
      ...project,
      meta: { ...project.meta, date: new Date().toISOString().split('T')[0] },
    };

    if (idx >= 0) {
      stored[idx] = updatedProject;
    } else {
      if (stored.length >= 20) {
        set({ error: '프로젝트 최대 개수(20개)에 도달했습니다. 기존 프로젝트를 삭제해 주세요. (Maximum 20 projects reached)' });
        return;
      }
      stored.push(updatedProject);
    }

    saveProjectsToStorage(stored);
    try {
      localStorage.setItem('meds-active-project', project.id);
      localStorage.setItem('meds-project', JSON.stringify(updatedProject));
    } catch { /* ignore */ }
    set({ project: updatedProject, projectList: loadProjectListFromStorage() });

    // Background sync to Turso (non-blocking)
    if (isTursoConfigured()) {
      dbSaveProject(
        updatedProject.id,
        updatedProject.meta.name,
        updatedProject.meta.vesselName,
        JSON.stringify(updatedProject),
      ).catch(() => { /* ignore Turso errors */ });
    }
  },

  loadProjectFromList: (projectId) => {
    const stored = getStoredProjects();
    const proj = stored.find(p => p.id === projectId);
    if (proj) {
      set({
        project: proj,
        loadBalanceResult: null,
        shortCircuitResult: null,
        voltageDropResult: null,
        diagramPositions: {},
      });
      try {
        localStorage.setItem('meds-active-project', projectId);
        localStorage.setItem('meds-project', JSON.stringify(proj));
      } catch { /* ignore */ }
    }
  },

  deleteProjectFromList: (projectId) => {
    const stored = getStoredProjects().filter(p => p.id !== projectId);
    saveProjectsToStorage(stored);
    set({ projectList: loadProjectListFromStorage() });
    // If deleting the active project, don't change current state

    // Background sync to Turso
    if (isTursoConfigured()) {
      dbDeleteProject(projectId).catch(() => { /* ignore */ });
    }
  },

  duplicateProject: (projectId) => {
    const stored = getStoredProjects();
    const source = stored.find(p => p.id === projectId);
    if (!source) return;
    if (stored.length >= 20) {
      set({ error: '프로젝트 최대 개수(20개)에 도달했습니다. (Maximum 20 projects reached)' });
      return;
    }
    const duplicate: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: uuidv4(),
      meta: {
        ...source.meta,
        name: source.meta.name + ' (복사본)',
        date: new Date().toISOString().split('T')[0],
      },
    };
    stored.push(duplicate);
    saveProjectsToStorage(stored);
    set({ projectList: loadProjectListFromStorage() });
  },

  getProjectList: () => {
    return loadProjectListFromStorage();
  },

  exportProjectFile: () => {
    const { project } = get();
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${project.meta.projectNumber}_${project.meta.vesselName}_${project.meta.revision}.meds.json`;
    downloadFile(blob, filename);
  },

  importProjectFile: async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string) as Project;
          if (!project.id || !project.meta || !project.generators || !project.buses || !project.loads) {
            set({ error: '유효하지 않은 프로젝트 파일입니다 (Invalid project file)' });
            reject(new Error('Invalid project file'));
            return;
          }
          // Give it a new ID to avoid conflicts
          project.id = uuidv4();
          project.meta.date = new Date().toISOString().split('T')[0];

          const stored = getStoredProjects();
          if (stored.length >= 20) {
            set({ error: '프로젝트 최대 개수(20개)에 도달했습니다. (Maximum 20 projects reached)' });
            reject(new Error('Max projects reached'));
            return;
          }
          stored.push(project);
          saveProjectsToStorage(stored);

          set({
            project,
            projectList: loadProjectListFromStorage(),
            loadBalanceResult: null,
            shortCircuitResult: null,
            voltageDropResult: null,
            diagramPositions: {},
          });
          try {
            localStorage.setItem('meds-active-project', project.id);
          } catch { /* ignore */ }
          resolve();
        } catch (err) {
          set({ error: '프로젝트 파일을 읽을 수 없습니다 (Failed to parse project file)' });
          reject(err);
        }
      };
      reader.onerror = () => {
        set({ error: '파일을 읽을 수 없습니다 (Failed to read file)' });
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  },

  refreshProjectList: () => {
    set({ projectList: loadProjectListFromStorage() });
  },

  clearError: () => set({ error: null }),
}));
