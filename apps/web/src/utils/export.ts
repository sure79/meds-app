import type { Project } from '../types';

/**
 * Download a blob as a file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export project as JSON file
 */
export function exportProjectJSON(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `${project.meta.projectNumber}_${project.meta.vesselName}_${project.meta.revision}.json`;
  downloadFile(blob, filename);
}

/**
 * Import project from JSON file
 */
export function importProjectJSON(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string) as Project;
        if (!project.id || !project.meta || !project.generators || !project.buses || !project.loads) {
          reject(new Error('Invalid project file format'));
          return;
        }
        resolve(project);
      } catch (err) {
        reject(new Error('Failed to parse project file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Export project data to CSV format for load balance
 */
export function exportLoadBalanceCSV(project: Project): void {
  const conditions = project.activeConditions;
  const headers = ['Load Name', 'Type', 'Rated kW', 'Bus', ...conditions];

  const rows = project.loads.map(load => {
    const condValues = conditions.map(cond => {
      const lf = load.loadFactors.find(f => f.condition === cond);
      const factor = lf ? lf.factor : 0;
      return (load.ratedPowerKW * factor * load.diversityFactor * load.quantity).toFixed(1);
    });
    const bus = project.buses.find(b => b.id === load.connectedBusId);
    return [load.name, load.type, load.ratedPowerKW.toString(), bus?.name || '', ...condValues];
  });

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, `${project.meta.projectNumber}_load_balance.csv`);
}
