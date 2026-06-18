"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = print;
exports.printJson = printJson;
exports.printJsonl = printJsonl;
exports.printResult = printResult;
exports.printCreateSuccess = printCreateSuccess;
exports.printTable = printTable;
exports.buildMeta = buildMeta;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * Print data in the requested format.
 * If format is undefined, auto-detects: table for TTY, json when piped.
 */
function print(data, format, columns) {
    const fmt = format ?? (process.stdout.isTTY ? 'table' : 'json');
    switch (fmt) {
        case 'json': return printJson(data);
        case 'jsonl': return printJsonl(data);
        case 'table': return printTable(data, columns);
    }
}
/**
 * Emit a single JSON envelope:
 * { "data": [...], "meta": { "total": N, "limit": N, "offset": N } }
 * or { "data": {...} } for single objects.
 */
function printJson(data, meta) {
    const envelope = wrapEnvelope(data, meta);
    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
}
/**
 * Emit one JSON object per line.
 * If data is an array, each element is emitted separately.
 * Otherwise a single line is emitted.
 */
function printJsonl(data) {
    if (Array.isArray(data)) {
        for (const item of data) {
            process.stdout.write(JSON.stringify(item) + '\n');
        }
    }
    else {
        process.stdout.write(JSON.stringify(data) + '\n');
    }
}
function wrapEnvelope(data, meta) {
    const envelope = { data };
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
/**
 * Print a single result (non-list) in the requested format.
 * Unlike {@link print}, this defaults to JSON in TTY mode because table
 * format is only appropriate for list endpoints.
 */
function printResult(data, format, columns) {
    const fmt = format ?? 'json';
    switch (fmt) {
        case 'json': return printJson(data);
        case 'jsonl': return printJsonl(data);
        case 'table': return printTable(data, columns);
    }
}
/**
 * Print a success message for resource creation.
 * In TTY mode (no explicit format): "Created new <label>: \"<id>\"." to stderr.
 * In pipe / explicit format mode: {"success":true,"<jsonKey>":"<id>"} to stdout.
 */
function printCreateSuccess(label, jsonKey, id, format) {
    if (!process.stdout.isTTY || format) {
        const result = { success: true };
        result[jsonKey] = id;
        process.stdout.write(JSON.stringify(result) + '\n');
    }
    else {
        process.stderr.write(`Created new ${label}: "${id}".\n`);
    }
}
function printTable(data, columns) {
    if (Array.isArray(data)) {
        if (data.length === 0) {
            process.stdout.write(chalk_1.default.dim('(no results)\n'));
            return;
        }
        // Arrays of primitives (strings, numbers, etc.) — render as a single column.
        if (data[0] === null || typeof data[0] !== 'object') {
            const col = columns?.[0] ?? 'value';
            const table = new cli_table3_1.default({
                head: [chalk_1.default.bold(col)],
                style: { head: [], border: [] },
            });
            for (const item of data) {
                table.push([formatCell(item)]);
            }
            process.stdout.write(table.toString() + '\n');
            return;
        }
        const allKeys = Object.keys(data[0]);
        const cols = columns ?? allKeys.filter(k => {
            const v = data[0][k];
            return !(v !== null && typeof v === 'object' && !Array.isArray(v));
        });
        const table = new cli_table3_1.default({
            head: cols.map((c) => chalk_1.default.bold(c)),
            style: { head: [], border: [] },
        });
        for (const row of data) {
            const r = row;
            table.push(cols.map((c) => formatCell(r[c])));
        }
        process.stdout.write(table.toString() + '\n');
        return;
    }
    if (data !== null && typeof data === 'object') {
        const obj = data;
        const table = new cli_table3_1.default({ style: { head: [], border: [] } });
        for (const [k, v] of Object.entries(obj)) {
            table.push({ [chalk_1.default.bold(k)]: formatCell(v) });
        }
        process.stdout.write(table.toString() + '\n');
        return;
    }
    // Scalar or null — just print it
    process.stdout.write(String(data) + '\n');
}
function formatCell(value) {
    if (value === null || value === undefined)
        return chalk_1.default.dim('-');
    if (typeof value === 'object')
        return JSON.stringify(value);
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
function buildMeta(rawData, headers) {
    // CDN Pro list responses are plain arrays; total may come from a header.
    let items = [];
    const meta = {};
    if (Array.isArray(rawData)) {
        items = rawData;
    }
    else if (rawData !== null && typeof rawData === 'object') {
        const obj = rawData;
        // CDN Pro list responses wrap results in a resource-specific array key,
        // e.g. { properties: [...], count: N } or { certificates: [...] }.
        // Find the first value that is an array.
        const arrayKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
        if (arrayKey !== undefined) {
            items = obj[arrayKey];
            // Most list endpoints include a count field; apicalls uses hasMore instead.
            if (obj.count !== undefined)
                meta.total = obj.count;
            if (obj.total !== undefined)
                meta.total = obj.total;
            if (obj.limit !== undefined)
                meta.limit = obj.limit;
            if (obj.offset !== undefined)
                meta.offset = obj.offset;
            if (obj.hasMore !== undefined)
                meta.hasMore = obj.hasMore;
        }
        else {
            // Single resource — pass through; don't wrap in array
            return { items: [], meta, single: rawData };
        }
    }
    if (headers) {
        const lm = headers['last-modified'] ?? headers['Last-Modified'];
        if (lm)
            meta.lastModified = Array.isArray(lm) ? lm[0] : lm;
    }
    return { items, meta };
}
//# sourceMappingURL=output.js.map