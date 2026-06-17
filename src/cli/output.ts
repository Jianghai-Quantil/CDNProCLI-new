import chalk from 'chalk';
import Table from 'cli-table3';

export type OutputFormat = 'table' | 'json' | 'jsonl';

/**
 * Print data in the requested format.
 * If format is undefined, auto-detects: table for TTY, json when piped.
 */
export function print(
  data: unknown,
  format: OutputFormat | undefined,
  columns?: string[],
): void {
  const fmt = format ?? (process.stdout.isTTY ? 'table' : 'json');

  switch (fmt) {
    case 'json':  return printJson(data);
    case 'jsonl': return printJsonl(data);
    case 'table': return printTable(data, columns);
  }
}

/**
 * Emit a single JSON envelope:
 * { "data": [...], "meta": { "total": N, "limit": N, "offset": N } }
 * or { "data": {...} } for single objects.
 */
export function printJson(data: unknown, meta?: Record<string, unknown>): void {
  const envelope = wrapEnvelope(data, meta);
  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
}

/**
 * Emit one JSON object per line.
 * If data is an array, each element is emitted separately.
 * Otherwise a single line is emitted.
 */
export function printJsonl(data: unknown): void {
  if (Array.isArray(data)) {
    for (const item of data) {
      process.stdout.write(JSON.stringify(item) + '\n');
    }
  } else {
    process.stdout.write(JSON.stringify(data) + '\n');
  }
}

function wrapEnvelope(
  data: unknown,
  meta?: Record<string, unknown>,
): Record<string, unknown> {
  const envelope: Record<string, unknown> = { data };
  if (meta && Object.keys(meta).length > 0) {
    envelope.meta = meta;
  }
  return envelope;
}

/**
 * Print data as an ASCII table.
 * - If data is an array of objects, renders each object as a row.
 * - If data is a single object, renders key/value pairs.
 * - Falls back to JSON if data cannot be rendered as a table.
 */
export function printTable(data: unknown, columns?: string[]): void {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      process.stdout.write(chalk.dim('(no results)\n'));
      return;
    }
    // Arrays of primitives (strings, numbers, etc.) — render as a single column.
    if (data[0] === null || typeof data[0] !== 'object') {
      const col = columns?.[0] ?? 'value';
      const table = new Table({
        head: [chalk.bold(col)],
        style: { head: [], border: [] },
      });
      for (const item of data) {
        table.push([formatCell(item)]);
      }
      process.stdout.write(table.toString() + '\n');
      return;
    }
    const allKeys = Object.keys(data[0] as Record<string, unknown>);
    const cols = columns ?? allKeys.filter(k => {
      const v = (data[0] as Record<string, unknown>)[k];
      return !(v !== null && typeof v === 'object' && !Array.isArray(v));
    });
    const table = new Table({
      head: cols.map((c) => chalk.bold(c)),
      style: { head: [], border: [] },
    });
    for (const row of data) {
      const r = row as Record<string, unknown>;
      table.push(cols.map((c) => formatCell(r[c])));
    }
    process.stdout.write(table.toString() + '\n');
    return;
  }

  if (data !== null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const table = new Table({ style: { head: [], border: [] } });
    for (const [k, v] of Object.entries(obj)) {
      table.push({ [chalk.bold(k)]: formatCell(v) });
    }
    process.stdout.write(table.toString() + '\n');
    return;
  }

  // Scalar or null — just print it
  process.stdout.write(String(data) + '\n');
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim('-');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Build a meta object from a list response.
 * Extracts total/limit/offset and lastModified from response headers.
 *
 * For list responses (arrays or `{ items: [...] }` wrappers), populates `items`.
 * For single-object responses, sets `single` and leaves `items` empty — the
 * caller should render `single` directly (e.g. via `printTable`) rather than
 * treating it as a one-element list.
 */
export function buildMeta(
  rawData: unknown,
  headers?: Record<string, string | string[] | undefined>,
): { items: unknown[]; meta: Record<string, unknown>; single?: unknown } {
  // CDN Pro list responses are plain arrays; total may come from a header.
  let items: unknown[] = [];
  const meta: Record<string, unknown> = {};

  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (rawData !== null && typeof rawData === 'object') {
    const obj = rawData as Record<string, unknown>;
    // CDN Pro list responses wrap results in a resource-specific array key,
    // e.g. { properties: [...], count: N } or { certificates: [...] }.
    // Find the first value that is an array.
    const arrayKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
    if (arrayKey !== undefined) {
      items = obj[arrayKey] as unknown[];
      // Most list endpoints include a count field; apicalls uses hasMore instead.
      if (obj.count !== undefined) meta.total = obj.count;
      if (obj.total !== undefined) meta.total = obj.total;
      if (obj.limit !== undefined) meta.limit = obj.limit;
      if (obj.offset !== undefined) meta.offset = obj.offset;
      if (obj.hasMore !== undefined) meta.hasMore = obj.hasMore;
    } else {
      // Single resource — pass through; don't wrap in array
      return { items: [], meta, single: rawData };
    }
  }

  if (headers) {
    const lm = headers['last-modified'] ?? headers['Last-Modified'];
    if (lm) meta.lastModified = Array.isArray(lm) ? lm[0] : lm;
  }

  return { items, meta };
}
