import { Command } from 'commander';
import { CliError } from './errors';

// ── Types ──────────────────────────────────────────────────────────

export interface OptionMapping {
  /** Commander flag string, e.g. '--limit <n>' or '--all' */
  flag: string;
  /** Where the value ends up in the API request */
  target: 'query' | 'header' | 'body' | 'cli-only';
  /** For query/header/body: the API parameter name or body path.
   *  null for cli-only. Body paths use dot notation: 'filters.hostnames'. */
  param: string | null;
  /** Description shown in --help */
  description: string;
  /** Mark the option as required (checked in action handler) */
  required?: boolean;
  /** True for repeatable array options */
  repeatable?: boolean;
  /** True for boolean flags (no value argument) */
  boolean?: boolean;
}

// ── Shared presets ─────────────────────────────────────────────────

export const PAGINATION_OPTIONS: OptionMapping[] = [
  { flag: '--limit <n>',  target: 'query', param: 'limit',  description: 'Page size' },
  { flag: '--offset <n>', target: 'query', param: 'offset', description: 'Page offset' },
];

export const SORT_OPTIONS: OptionMapping[] = [
  { flag: '--sort-by <field>',   target: 'query', param: 'sortBy',   description: 'Sort field' },
  { flag: '--sort-order <order>', target: 'query', param: 'sortOrder', description: 'Sort direction: asc | desc' },
];

export const REPORT_RANGE: OptionMapping = {
  flag: '--report-range <scope>',
  target: 'header',
  param: 'Report-Range',
  description: 'Report-Range: self-only | self+children | children-only',
};

export const FILE_EXAMPLE: OptionMapping[] = [
  { flag: '--file <path>', target: 'cli-only', param: null, description: 'JSON body file (- for stdin)' },
  { flag: '--example',     target: 'cli-only', param: null, description: 'Print example body and exit' },
];

export const IF_UNMODIFIED_SINCE: OptionMapping = {
  flag: '--if-unmodified-since <date>',
  target: 'header',
  param: 'If-Unmodified-Since',
  description: 'Fail if resource has been modified since this RFC 3339 date',
};

export const CONFIRM: OptionMapping = {
  flag: '--confirm',
  target: 'cli-only',
  param: null,
  description: 'Skip confirmation prompt',
  boolean: true,
};

export const ALL: OptionMapping = {
  flag: '--all',
  target: 'cli-only',
  param: null,
  description: 'Auto-paginate; implies --output jsonl',
  boolean: true,
};

// ── Flag helpers ───────────────────────────────────────────────────

/** Extract the bare flag name from a Commander flag string.
 *  '--limit <n>' → '--limit', '--all' → '--all'. */
export function flagToCliFlag(flag: string): string {
  const m = flag.match(/^(--[\w-]+)/);
  return m ? m[1] : flag;
}

/** Derive Commander attribute name from a flag: '--sort-by' → 'sortBy'. */
export function flagToAttr(flag: string): string {
  const m = flag.match(/--([\w-]+)/);
  if (!m) throw new Error(`Cannot parse flag: ${flag}`);
  return m[1].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ── Commander integration ──────────────────────────────────────────

/** Register Commander .option() calls from an OptionMapping array. */
export function registerOptionsFromMapping(cmd: Command, mappings: OptionMapping[]): void {
  for (const m of mappings) {
    if (m.repeatable) {
      cmd.option(m.flag, m.description, (v: string, prev: string[]) => [...prev, v], [] as string[]);
    } else {
      cmd.option(m.flag, m.description);
    }
  }
}

/** Build { query, reqOptions, body } from parsed Commander opts. */
export function buildRequestFromMapping(
  opts: Record<string, unknown>,
  mappings: OptionMapping[],
): {
  query: Record<string, unknown>;
  reqOptions: Record<string, unknown>;
  body: Record<string, unknown> | null;
} {
  const query: Record<string, unknown> = {};
  const reqOptions: Record<string, unknown> = {};
  let bodyObj: Record<string, unknown> | null = null;

  for (const m of mappings) {
    if (m.target === 'cli-only' || m.param === null) continue;

    const attr = flagToAttr(m.flag);
    const val = opts[attr];
    if (val === undefined || val === null || val === '') continue;

    // Boolean flags are set to true by Commander; convert to string for query params
    const value = (m.boolean && m.target === 'query') ? String(val) : val;

    switch (m.target) {
      case 'query':
        query[m.param] = value;
        break;
      case 'header':
        reqOptions[attr] = value;
        break;
      case 'body':
        if (!bodyObj) bodyObj = {};
        setNestedPath(bodyObj, m.param, value);
        break;
    }
  }

  return { query, reqOptions, body: bodyObj };
}

/** Validate required options from mappings. */
export function checkRequiredMappings(
  opts: Record<string, unknown>,
  mappings: OptionMapping[],
): void {
  for (const m of mappings) {
    if (!m.required) continue;
    const attr = flagToAttr(m.flag);
    if (opts[attr] === undefined || opts[attr] === null || opts[attr] === '') {
      throw new CliError('VALIDATION', `Required option ${flagToCliFlag(m.flag)} not specified`);
    }
  }
}

// ── Internal helpers ───────────────────────────────────────────────

function setNestedPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

// ── Registry (for schema command to introspect mappings) ───────────

const mappingRegistry = new Map<string, OptionMapping[]>();

/** Register option mappings for a CLI operation (resource.operation). */
export function registerMappings(
  resource: string,
  operation: string,
  mappings: OptionMapping[],
): void {
  mappingRegistry.set(`${resource}.${operation}`, mappings);
}

/** Look up option mappings for a CLI operation. */
export function getMappings(
  resource: string,
  operation: string,
): OptionMapping[] | undefined {
  return mappingRegistry.get(`${resource}.${operation}`);
}
