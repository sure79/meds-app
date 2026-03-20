import type { Project, LoadBalanceResult, ShortCircuitResult, VoltageDropResult, CableType } from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export async function calculateLoadBalance(project: Project): Promise<LoadBalanceResult> {
  return fetchJSON<LoadBalanceResult>('/calculate/load-balance', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function calculateShortCircuit(
  project: Project,
  options: { motorContribution: boolean; busTiesClosed: boolean }
): Promise<ShortCircuitResult> {
  return fetchJSON<ShortCircuitResult>('/calculate/short-circuit', {
    method: 'POST',
    body: JSON.stringify({ project, ...options }),
  });
}

export async function calculateVoltageDrop(
  project: Project,
  options: { ambientTempC: number; cableType: CableType }
): Promise<VoltageDropResult> {
  return fetchJSON<VoltageDropResult>('/calculate/voltage-drop', {
    method: 'POST',
    body: JSON.stringify({ project, ...options }),
  });
}

export async function exportExcel(project: Project): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}

export async function exportDrawio(project: Project): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/drawio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}

export async function exportPDF(project: Project): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}
