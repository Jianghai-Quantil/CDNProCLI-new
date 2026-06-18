export type OutputFormat = 'table' | 'json' | 'jsonl';
/**
 * Print data in the requested format.
 * If format is undefined, auto-detects: table for TTY, json when piped.
 */
export declare function print(data: unknown, format: OutputFormat | undefined, columns?: string[]): void;
/**
 * Emit a single JSON envelope:
 * { "data": [...], "meta": { "total": N, "limit": N, "offset": N } }
 * or { "data": {...} } for single objects.
 */
export declare function printJson(data: unknown, meta?: Record<string, unknown>): void;
/**
 * Emit one JSON object per line.
 * If data is an array, each element is emitted separately.
 * Otherwise a single line is emitted.
 */
export declare function printJsonl(data: unknown): void;
/**
 * Print data as an ASCII table.
 * - If data is an array of objects, renders each object as a row.
 * - If data is a single object, renders key/value pairs.
 * - Falls back to JSON if data cannot be rendered as a table.
 */
/**
 * Print a single result (non-list) in the requested format.
 * Unlike {@link print}, this defaults to JSON in TTY mode because table
 * format is only appropriate for list endpoints.
 */
export declare function printResult(data: unknown, format: OutputFormat | undefined, columns?: string[]): void;
/**
 * Print a success message for resource creation.
 * In TTY mode (no explicit format): "Created new <label>: \"<id>\"." to stderr.
 * In pipe / explicit format mode: {"success":true,"<jsonKey>":"<id>"} to stdout.
 */
export declare function printCreateSuccess(label: string, jsonKey: string, id: string, format?: string): void;
export declare function printTable(data: unknown, columns?: string[]): void;
/**
 * Build a meta object from a list response.
 * Extracts total/limit/offset and lastModified from response headers.
 *
 * For list responses (arrays or `{ items: [...] }` wrappers), populates `items`.
 * For single-object responses, sets `single` and leaves `items` empty — the
 * caller should render `single` directly (e.g. via `printTable`) rather than
 * treating it as a one-element list.
 */
export declare function buildMeta(rawData: unknown, headers?: Record<string, string | string[] | undefined>): {
    items: unknown[];
    meta: Record<string, unknown>;
    single?: unknown;
};
//# sourceMappingURL=output.d.ts.map