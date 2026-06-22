"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchemaCommand = registerSchemaCommand;
const query_1 = require("../../schema/query");
const loader_1 = require("../../schema/loader");
const option_map_1 = require("../option-map");
const VALID_DIRECTIONS = ['request', 'response', 'both'];
const SYNTAX = 'Usage: cdnpro schema <resource> <operation> [--direction request|response|both]';
function getUniqueResources() {
    return [...new Set(Object.keys(query_1.OPERATION_MAP).map(k => k.split('.')[0]))].sort();
}
function getOperationsForResource(resource) {
    const prefix = `${resource}.`;
    return Object.keys(query_1.OPERATION_MAP)
        .filter(k => k.startsWith(prefix))
        .map(k => k.slice(prefix.length))
        .sort();
}
function formatAvailableResources() {
    const resources = getUniqueResources();
    const maxLen = Math.max(...resources.map(r => r.length));
    return resources
        .map(r => {
        const ops = getOperationsForResource(r);
        const padding = ' '.repeat(maxLen - r.length + 2);
        return `  ${r}${padding}${ops.join(', ')}`;
    })
        .join('\n');
}
function registerSchemaCommand(parent) {
    parent
        .command('schema [resource] [operation]')
        .description('Inspect the OpenAPI schema for a CLI operation — request body, query parameters, headers, and response schema')
        .option('--direction <direction>', 'What to show: request | response | both [default: both]', 'both')
        .action((resource, operation, opts) => {
        // No resource provided — show full syntax and resource list
        if (!resource) {
            process.stderr.write(`${SYNTAX}\n\nAvailable resources and operations:\n${formatAvailableResources()}\n`);
            process.exit(1);
        }
        // Resource provided but no operation
        if (!operation) {
            const ops = getOperationsForResource(resource);
            if (ops.length === 0) {
                process.stderr.write(`Unknown resource: '${resource}'\n\n${SYNTAX}\n\nAvailable resources:\n${getUniqueResources().map(r => `  ${r}`).join('\n')}\n`);
            }
            else {
                process.stderr.write(`Missing operation for resource '${resource}'.\n\n${SYNTAX}\n\nAvailable operations for '${resource}':\n${ops.map(op => `  cdnpro schema ${resource} ${op}`).join('\n')}\n`);
            }
            process.exit(1);
        }
        // Validate --direction
        if (!VALID_DIRECTIONS.includes(opts.direction)) {
            process.stderr.write(`Invalid --direction value: '${opts.direction}'\n\n${SYNTAX}\n\nValid --direction values: ${VALID_DIRECTIONS.join(' | ')}\n`);
            process.exit(1);
        }
        const entry = (0, query_1.lookupOperation)(resource, operation);
        if (!entry) {
            const ops = getOperationsForResource(resource);
            if (ops.length === 0) {
                process.stderr.write(`Unknown resource: '${resource}'\n\n${SYNTAX}\n\nAvailable resources:\n${getUniqueResources().map(r => `  ${r}`).join('\n')}\n`);
            }
            else {
                process.stderr.write(`Unknown operation '${operation}' for resource '${resource}'.\n\n${SYNTAX}\n\nAvailable operations for '${resource}':\n${ops.map(op => `  cdnpro schema ${resource} ${op}`).join('\n')}\n`);
            }
            process.exit(1);
        }
        const { method, path } = entry;
        const direction = opts.direction;
        // Look up the operation summary from the spec for the "operation" field
        const operationId = getOperationId(path, method);
        if (direction === 'response') {
            const { schema: responseSchema, httpStatus } = (0, loader_1.getResponseSchema)(path, method);
            const output = {
                operation: operationId,
                method: method.toUpperCase(),
                path,
                direction: 'response',
                httpStatus,
                schema: responseSchema,
            };
            process.stdout.write(JSON.stringify(output, null, 2) + '\n');
            return;
        }
        const requestObj = buildRequestObject(path, method, resource, operation);
        if (direction === 'request') {
            const output = {
                operation: operationId,
                method: method.toUpperCase(),
                path,
                direction: 'request',
                ...requestObj,
            };
            process.stdout.write(JSON.stringify(output, null, 2) + '\n');
            return;
        }
        // direction === 'both'
        const { schema: responseSchema, httpStatus } = (0, loader_1.getResponseSchema)(path, method);
        const output = {
            operation: operationId,
            method: method.toUpperCase(),
            path,
            direction: 'both',
            request: requestObj,
            response: {
                httpStatus,
                schema: responseSchema,
            },
        };
        process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    });
}
function buildRequestObject(path, method, resource, operation) {
    const headers = (0, loader_1.getRequestHeaders)(path, method);
    const mappings = (0, option_map_1.getMappings)(resource, operation);
    const isBodyMethod = ['post', 'put', 'patch'].includes(method.toLowerCase());
    if (isBodyMethod) {
        const { schema: bodySchema, required } = (0, loader_1.getRequestBodySchema)(path, method);
        const obj = { required };
        if (bodySchema !== null) {
            obj['contentType'] = 'application/json';
            obj['schema'] = bodySchema;
        }
        // Annotate query params (report commands have query params even on POST)
        const queryParams = (0, loader_1.getQueryParameters)(path, method);
        if (queryParams) {
            obj['queryParameters'] = annotateFromMappings(queryParams, 'query', mappings);
        }
        if (Object.keys(headers).length > 0) {
            obj['requestHeaders'] = annotateFromMappings(headers, 'header', mappings);
        }
        // Collect body cliFlags from mappings
        const bodyFlags = buildBodyCliFlags(mappings);
        if (bodyFlags)
            obj['bodyCliFlags'] = bodyFlags;
        return obj;
    }
    // GET / DELETE
    const queryParams = (0, loader_1.getQueryParameters)(path, method);
    const obj = {};
    if (queryParams) {
        obj['queryParameters'] = annotateFromMappings(queryParams, 'query', mappings);
    }
    if (Object.keys(headers).length > 0) {
        obj['requestHeaders'] = annotateFromMappings(headers, 'header', mappings);
    }
    return obj;
}
/**
 * Annotate schema parameters (query or header) with cliFlag + required
 * from option mappings.  Preserves existing schema fields (type, enum, default, etc.)
 * and overrides cliFlag/required when a mapping exists.
 */
function annotateFromMappings(params, target, mappings) {
    const result = {};
    for (const [name, info] of Object.entries(params)) {
        const mapping = mappings?.find(m => m.target === target && m.param === name);
        result[name] = {
            ...info,
            ...(mapping ? { cliFlag: (0, option_map_1.flagToCliFlag)(mapping.flag) } : {}),
            ...(mapping?.required !== undefined ? { required: mapping.required } : {}),
            ...(mapping?.boolean !== undefined ? { boolean: mapping.boolean } : {}),
            ...(mapping?.repeatable !== undefined ? { repeatable: mapping.repeatable } : {}),
        };
    }
    return result;
}
/** Build bodyCliFlags object from body-targeted mappings. */
function buildBodyCliFlags(mappings) {
    if (!mappings)
        return null;
    const bodyMappings = mappings.filter(m => m.target === 'body');
    if (bodyMappings.length === 0)
        return null;
    const result = {};
    for (const m of bodyMappings) {
        result[m.param] = {
            cliFlag: (0, option_map_1.flagToCliFlag)(m.flag),
            ...(m.repeatable ? { repeatable: true } : {}),
            description: m.description,
        };
    }
    return result;
}
function getOperationId(path, method) {
    try {
        // Dynamic import via require to avoid circular deps
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const openapiRaw = require('../../../openapi.json');
        const op = openapiRaw.paths?.[path]?.[method.toLowerCase()];
        return op?.operationId ?? op?.summary ?? `${method.toUpperCase()} ${path}`;
    }
    catch {
        return `${method.toUpperCase()} ${path}`;
    }
}
//# sourceMappingURL=schema.js.map