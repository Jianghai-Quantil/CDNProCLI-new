"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpec = getSpec;
exports.getRequestHeaders = getRequestHeaders;
exports.getRequestBodySchema = getRequestBodySchema;
exports.getResponseSchema = getResponseSchema;
exports.getQueryParameters = getQueryParameters;
exports.getNamedSpecExample = getNamedSpecExample;
exports.getSpecExample = getSpecExample;
const openapi_json_1 = __importDefault(require("../../openapi.json"));
let _spec = null;
function getSpec() {
    if (!_spec)
        _spec = openapi_json_1.default;
    return _spec;
}
/**
 * Returns all header parameters for an operation as a requestHeaders map.
 * Each entry includes the cliFlag derived from the header name.
 */
function getRequestHeaders(openapiPath, method) {
    const spec = getSpec();
    const op = spec.paths[openapiPath]?.[method.toLowerCase()];
    const params = op?.parameters ?? [];
    const result = {};
    for (const p of params) {
        if (p['in'] !== 'header')
            continue;
        const schema = p['schema'];
        result[p['name']] = {
            type: schema?.['type'] ?? 'string',
            cliFlag: headerNameToCliFlag(p['name']),
            ...(schema?.['enum'] ? { values: schema['enum'] } : {}),
            ...(schema?.['default'] !== undefined ? { default: schema['default'] } : {}),
            description: (p['description'] ?? '').replace(/<[^>]+>/g, '').trim(),
            required: p['required'] ?? false,
        };
    }
    return result;
}
/**
 * Maps an HTTP header name to the CLI flag convention.
 * Check-* bypass headers use --skip-* for clarity.
 */
function headerNameToCliFlag(headerName) {
    const overrides = {
        'Check-Certificate': '--skip-certificate-check',
        'Check-Client-CA-Certificate': '--skip-client-ca-certificate-check',
        'Check-Origin-Auth-Certificate': '--skip-origin-auth-certificate-check',
        'Check-Usage': '--skip-usage-check',
    };
    return overrides[headerName] ?? '--' + headerName.toLowerCase().replace(/\s+/g, '-');
}
function getRequestBodySchema(path, method) {
    const spec = getSpec();
    const op = spec.paths[path]?.[method.toLowerCase()];
    if (!op)
        return { schema: null, required: false };
    const content = (op['requestBody']?.['content']);
    const schema = content?.['application/json']?.['schema'] ?? null;
    return { schema, required: !!(op['requestBody']?.['required']) };
}
function getResponseSchema(path, method) {
    const spec = getSpec();
    const op = spec.paths[path]?.[method.toLowerCase()];
    const responses = op?.['responses'];
    const response = responses?.['200'] ?? responses?.['201'] ?? responses?.['204'];
    const content = (response?.['content']);
    const status = responses?.['201'] ? 201 : responses?.['204'] ? 204 : 200;
    return { schema: content?.['application/json']?.['schema'] ?? null, httpStatus: status };
}
function getQueryParameters(path, method) {
    const spec = getSpec();
    const op = spec.paths[path]?.[method.toLowerCase()];
    const params = op?.['parameters'];
    if (!params)
        return null;
    const result = {};
    for (const p of params) {
        if (p['in'] === 'query') {
            result[p['name']] = { ...p['schema'], description: p['description'] };
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
/**
 * Returns a specific named example from the spec, or the first example if name is not found.
 * Returns null if no examples exist.
 */
function getNamedSpecExample(path, method, name) {
    const spec = getSpec();
    const op = spec.paths[path]?.[method.toLowerCase()];
    const content = op?.['requestBody']?.['content'];
    const mediaType = content?.['application/json'];
    if (!mediaType)
        return null;
    const examples = mediaType['examples'];
    if (!examples)
        return null;
    if (examples[name]?.value !== undefined)
        return examples[name].value;
    // Fall back to first example
    const first = Object.values(examples)[0];
    return first?.value ?? null;
}
/**
 * Returns the first named example value, then singular example, then schema.example.
 * Returns null if no example is found (synthesize.ts handles fallback).
 */
function getSpecExample(path, method) {
    const spec = getSpec();
    const op = spec.paths[path]?.[method.toLowerCase()];
    const content = op?.['requestBody']?.['content'];
    const mediaType = content?.['application/json'];
    if (!mediaType)
        return null;
    const examples = mediaType['examples'];
    if (examples) {
        const first = Object.values(examples)[0];
        if (first?.value !== undefined)
            return first.value;
    }
    if (mediaType['example'] !== undefined)
        return mediaType['example'];
    const schema = mediaType['schema'];
    if (schema?.['example'] !== undefined)
        return schema['example'];
    return null;
}
//# sourceMappingURL=loader.js.map