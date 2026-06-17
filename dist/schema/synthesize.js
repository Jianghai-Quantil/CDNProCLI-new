"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExampleBody = getExampleBody;
exports.synthesizeFromSchema = synthesizeFromSchema;
const loader_1 = require("./loader");
/**
 * Returns an example body for the given operation.
 * Priority: spec named examples → spec singular example → schema.example → synthesized.
 */
function getExampleBody(openapiPath, method) {
    const specExample = (0, loader_1.getSpecExample)(openapiPath, method);
    if (specExample !== null)
        return specExample;
    const { schema } = (0, loader_1.getRequestBodySchema)(openapiPath, method);
    if (!schema)
        return null;
    return synthesizeFromSchema(schema);
}
/**
 * Synthesis rules (applied recursively).
 * Optional properties are prefixed with "_optional_" so agents know they can be dropped.
 */
function synthesizeFromSchema(schema, key = 'value', _seen = new Set()) {
    if (!schema || typeof schema !== 'object')
        return null;
    if (schema['$ref']) {
        const ref = schema['$ref'];
        if (_seen.has(ref))
            return `<recursive:${ref}>`;
        _seen.add(ref);
        const resolved = resolveRef(ref);
        return resolved ? synthesizeFromSchema(resolved, key, _seen) : null;
    }
    const type = schema['type'];
    if (type === 'object' || schema['properties']) {
        const props = schema['properties'] ?? {};
        const required = schema['required'] ?? [];
        const result = {};
        for (const reqKey of required) {
            result[reqKey] = synthesizeFromSchema(props[reqKey] ?? {}, reqKey, _seen);
        }
        for (const [optKey, optSchema] of Object.entries(props)) {
            if (!required.includes(optKey)) {
                result[`_optional_${optKey}`] = synthesizeFromSchema(optSchema, optKey, _seen);
            }
        }
        return result;
    }
    if (type === 'array') {
        const items = schema['items'];
        return [items ? synthesizeFromSchema(items, key, _seen) : null];
    }
    if (type === 'string') {
        if (schema['enum'])
            return schema['enum'][0];
        if (schema['format'] === 'date-time')
            return '2026-01-01T00:00:00Z';
        if (schema['format'] === 'date')
            return '2026-01-01';
        return `<${key}>`;
    }
    if (type === 'integer' || type === 'number') {
        return schema['minimum'] ?? 0;
    }
    if (type === 'boolean')
        return false;
    return null;
}
function resolveRef(ref) {
    const spec = (0, loader_1.getSpec)();
    const parts = ref.replace(/^#\//, '').split('/');
    let node = spec;
    for (const part of parts) {
        node = node[part];
        if (node === undefined)
            return null;
    }
    return node;
}
//# sourceMappingURL=synthesize.js.map