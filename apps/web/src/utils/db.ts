/**
 * Turso (libSQL) database integration for MEDS
 *
 * If VITE_TURSO_DB_URL and VITE_TURSO_DB_AUTH_TOKEN are set,
 * projects are stored in Turso cloud database.
 * Otherwise, falls back to localStorage.
 *
 * To configure Turso:
 *   1. Create a free database at https://turso.tech
 *   2. Run: turso db create meds-projects
 *   3. Run: turso db tokens create meds-projects
 *   4. Set env vars in .env.local:
 *      VITE_TURSO_DB_URL=libsql://meds-projects-<your-org>.turso.io
 *      VITE_TURSO_DB_AUTH_TOKEN=<token>
 */

export interface ProjectRow {
  id: string;
  name: string;
  vessel_name: string;
  data: string;
  updated_at: string;
}

// Turso HTTP API wrapper (works in browsers without Node.js)
async function tursoExecute(
  url: string,
  authToken: string,
  sql: string,
  args: (string | number | null)[] = [],
): Promise<{ rows: Record<string, unknown>[] }> {
  const dbUrl = url.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '');
  const endpoint = `${dbUrl}/v2/pipeline`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: args.map(a =>
              a === null
                ? { type: 'null' }
                : typeof a === 'number'
                  ? { type: 'float', value: a }
                  : { type: 'text', value: String(a) },
            ),
          },
        },
        { type: 'close' },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Turso HTTP error: ${response.status}`);
  }

  const json = await response.json();
  const result = json.results?.[0];
  if (!result || result.type === 'error') {
    throw new Error(result?.error?.message || 'Turso query failed');
  }

  const cols: string[] = result.response?.result?.cols?.map((c: { name: string }) => c.name) ?? [];
  const rows: Record<string, unknown>[] = (result.response?.result?.rows ?? []).map(
    (row: { type: string; value: unknown }[]) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => {
        obj[col] = row[i]?.value ?? null;
      });
      return obj;
    },
  );

  return { rows };
}

function getTursoConfig(): { url: string; authToken: string } | null {
  const url = import.meta.env.VITE_TURSO_DB_URL;
  const authToken = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return { url, authToken };
}

export const isTursoConfigured = (): boolean => !!getTursoConfig();

// ---- Init ----

let dbInitialized = false;

export async function initDB(): Promise<void> {
  const config = getTursoConfig();
  if (!config) return;
  if (dbInitialized) return;

  await tursoExecute(
    config.url,
    config.authToken,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vessel_name TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  dbInitialized = true;
}

// ---- CRUD ----

export async function dbSaveProject(id: string, name: string, vesselName: string, data: string): Promise<void> {
  const config = getTursoConfig();
  const updatedAt = new Date().toISOString();

  if (!config) {
    // localStorage fallback
    const meta = { id, name, vesselName, updatedAt };
    localStorage.setItem(`meds-proj-${id}`, data);
    // Update index
    const index = getLocalIndex();
    const existing = index.findIndex(p => p.id === id);
    if (existing >= 0) index[existing] = meta;
    else index.unshift(meta);
    saveLocalIndex(index.slice(0, 20));
    return;
  }

  await tursoExecute(
    config.url,
    config.authToken,
    `INSERT OR REPLACE INTO projects (id, name, vessel_name, data, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, name, vesselName, data, updatedAt],
  );
}

export async function dbLoadProject(id: string): Promise<string | null> {
  const config = getTursoConfig();

  if (!config) {
    return localStorage.getItem(`meds-proj-${id}`);
  }

  const result = await tursoExecute(
    config.url,
    config.authToken,
    `SELECT data FROM projects WHERE id = ?`,
    [id],
  );
  return (result.rows[0]?.data as string) ?? null;
}

export async function dbListProjects(): Promise<Array<{ id: string; name: string; vessel_name: string; updated_at: string }>> {
  const config = getTursoConfig();

  if (!config) {
    return getLocalIndex().map(p => ({
      id: p.id,
      name: p.name,
      vessel_name: p.vesselName,
      updated_at: p.updatedAt,
    }));
  }

  const result = await tursoExecute(
    config.url,
    config.authToken,
    `SELECT id, name, vessel_name, updated_at FROM projects ORDER BY updated_at DESC`,
  );
  return result.rows as Array<{ id: string; name: string; vessel_name: string; updated_at: string }>;
}

export async function dbDeleteProject(id: string): Promise<void> {
  const config = getTursoConfig();

  if (!config) {
    localStorage.removeItem(`meds-proj-${id}`);
    saveLocalIndex(getLocalIndex().filter(p => p.id !== id));
    return;
  }

  await tursoExecute(
    config.url,
    config.authToken,
    `DELETE FROM projects WHERE id = ?`,
    [id],
  );
}

// ---- localStorage index helpers ----

interface LocalIndexEntry {
  id: string;
  name: string;
  vesselName: string;
  updatedAt: string;
}

function getLocalIndex(): LocalIndexEntry[] {
  try {
    return JSON.parse(localStorage.getItem('meds-projects-index') || '[]');
  } catch {
    return [];
  }
}

function saveLocalIndex(index: LocalIndexEntry[]): void {
  localStorage.setItem('meds-projects-index', JSON.stringify(index));
}
