import { Command } from 'commander';
import { lookupOperation, OPERATION_MAP } from '../../schema/query';
import {
  getRequestBodySchema,
  getResponseSchema,
  getQueryParameters,
  getRequestHeaders,
} from '../../schema/loader';
import { getMappings, flagToCliFlag, OptionMapping } from '../option-map';

type Direction = 'request' | 'response' | 'both';

const VALID_DIRECTIONS: Direction[] = ['request', 'response', 'both'];

const SYNTAX = 'Usage: cdnpro schema <resource> <operation> [--direction request|response|both]';

function getUniqueResources(): string[] {
  return [...new Set(Object.keys(OPERATION_MAP).map(k => k.split('.')[0]))].sort();
}

function getOperationsForResource(resource: string): string[] {
  const prefix = `${resource}.`;
  return Object.keys(OPERATION_MAP)
    .filter(k => k.startsWith(prefix))
    .map(k => k.slice(prefix.length))
    .sort();
}

function formatAvailableResources(): string {
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

export function registerSchemaCommand(parent: Command): void {
  parent
    .command('schema [resource] [operation]')
    .description(
      'Inspect the OpenAPI schema for a CLI operation — request body, query parameters, headers, and response schema',
    )
    .option(
      '--direction <direction>',
      'What to show: request | response | both [default: both]',
      'both',
    )
    .action((resource: string | undefined, operation: string | undefined, opts: { direction: string }) => {
      // No resource provided — show full syntax and resource list
      if (!resource) {
        process.stderr.write(
          `${SYNTAX}\n\nAvailable resources and operations:\n${formatAvailableResources()}\n`,
        );
        process.exit(1);
      }

      // Resource provided but no operation
      if (!operation) {
        const ops = getOperationsForResource(resource);
        if (ops.length === 0) {
          process.stderr.write(
            `Unknown resource: '${resource}'\n\n${SYNTAX}\n\nAvailable resources:\n${getUniqueResources().map(r => `  ${r}`).join('\n')}\n`,
          );
        } else {
          process.stderr.write(
            `Missing operation for resource '${resource}'.\n\n${SYNTAX}\n\nAvailable operations for '${resource}':\n${ops.map(op => `  cdnpro schema ${resource} ${op}`).join('\n')}\n`,
          );
        }
        process.exit(1);
      }

      // Validate --direction
      if (!VALID_DIRECTIONS.includes(opts.direction as Direction)) {
        process.stderr.write(
          `Invalid --direction value: '${opts.direction}'\n\n${SYNTAX}\n\nValid --direction values: ${VALID_DIRECTIONS.join(' | ')}\n`,
        );
        process.exit(1);
      }

      const entry = lookupOperation(resource, operation);
      if (!entry) {
        const ops = getOperationsForResource(resource);
        if (ops.length === 0) {
          process.stderr.write(
            `Unknown resource: '${resource}'\n\n${SYNTAX}\n\nAvailable resources:\n${getUniqueResources().map(r => `  ${r}`).join('\n')}\n`,
          );
        } else {
          process.stderr.write(
            `Unknown operation '${operation}' for resource '${resource}'.\n\n${SYNTAX}\n\nAvailable operations for '${resource}':\n${ops.map(op => `  cdnpro schema ${resource} ${op}`).join('\n')}\n`,
          );
        }
        process.exit(1);
      }

      const { method, path } = entry;
      const direction = opts.direction as Direction;

      // Look up the operation summary from the spec for the "operation" field
      const operationId = getOperationId(path, method);

      if (direction === 'response') {
        const { schema: responseSchema, httpStatus } = getResponseSchema(path, method);
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
      const { schema: responseSchema, httpStatus } = getResponseSchema(path, method);
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

function buildRequestObject(
  path: string,
  method: string,
  resource: string,
  operation: string,
): Record<string, unknown> {
  const headers = getRequestHeaders(path, method);
  const mappings = getMappings(resource, operation);
  const isBodyMethod = ['post', 'put', 'patch'].includes(method.toLowerCase());

  if (isBodyMethod) {
    const { schema: bodySchema, required } = getRequestBodySchema(path, method);
    const obj: Record<string, unknown> = { required };
    if (bodySchema !== null) {
      obj['contentType'] = 'application/json';
      obj['schema'] = bodySchema;
    }

    // Annotate query params (report commands have query params even on POST)
    const queryParams = getQueryParameters(path, method);
    if (queryParams) {
      obj['queryParameters'] = annotateFromMappings(queryParams, 'query', mappings);
    }

    if (Object.keys(headers).length > 0) {
      obj['requestHeaders'] = annotateFromMappings(headers, 'header', mappings);
    }

    // Collect body cliFlags from mappings
    const bodyFlags = buildBodyCliFlags(mappings);
    if (bodyFlags) obj['bodyCliFlags'] = bodyFlags;

    return obj;
  }

  // GET / DELETE
  const queryParams = getQueryParameters(path, method);
  const obj: Record<string, unknown> = {};
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
function annotateFromMappings(
  params: Record<string, unknown>,
  target: 'query' | 'header',
  mappings: OptionMapping[] | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, info] of Object.entries(params)) {
    const mapping = mappings?.find(m => m.target === target && m.param === name);
    result[name] = {
      ...(info as object),
      ...(mapping ? { cliFlag: flagToCliFlag(mapping.flag) } : {}),
      ...(mapping?.required !== undefined ? { required: mapping.required } : {}),
      ...(mapping?.boolean !== undefined ? { boolean: mapping.boolean } : {}),
      ...(mapping?.repeatable !== undefined ? { repeatable: mapping.repeatable } : {}),
    };
  }
  return result;
}

/** Build bodyCliFlags object from body-targeted mappings. */
function buildBodyCliFlags(
  mappings: OptionMapping[] | undefined,
): Record<string, { cliFlag: string; repeatable?: boolean; description?: string }> | null {
  if (!mappings) return null;
  const bodyMappings = mappings.filter(m => m.target === 'body');
  if (bodyMappings.length === 0) return null;
  const result: Record<string, { cliFlag: string; repeatable?: boolean; description?: string }> = {};
  for (const m of bodyMappings) {
    result[m.param!] = {
      cliFlag: flagToCliFlag(m.flag),
      ...(m.repeatable ? { repeatable: true } : {}),
      description: m.description,
    };
  }
  return result;
}

function getOperationId(path: string, method: string): string {
  try {
    // Dynamic import via require to avoid circular deps
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const openapiRaw = require('../../../openapi.json') as {
      paths?: Record<string, Record<string, { operationId?: string; summary?: string }>>;
    };
    const op = openapiRaw.paths?.[path]?.[method.toLowerCase()];
    return op?.operationId ?? op?.summary ?? `${method.toUpperCase()} ${path}`;
  } catch {
    return `${method.toUpperCase()} ${path}`;
  }
}
