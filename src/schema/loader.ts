import openapiRaw from '../../openapi.json';

let _spec: typeof openapiRaw | null = null;

export function getSpec(): typeof openapiRaw {
  if (!_spec) _spec = openapiRaw;
  return _spec;
}

/**
 * Returns all header parameters for an operation as a requestHeaders map.
 * Each entry includes the cliFlag derived from the header name.
 */
export function getRequestHeaders(openapiPath: string, method: string): Record<string, unknown> {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[openapiPath]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const params = (op?.parameters as Array<Record<string, unknown>> | undefined) ?? [];
  const result: Record<string, unknown> = {};

  for (const p of params) {
    if (p['in'] !== 'header') continue;
    const schema = p['schema'] as Record<string, unknown> | undefined;
    result[p['name'] as string] = {
      type: schema?.['type'] ?? 'string',
      cliFlag: headerNameToCliFlag(p['name'] as string),
      ...(schema?.['enum'] ? { values: schema['enum'] } : {}),
      ...(schema?.['default'] !== undefined ? { default: schema['default'] } : {}),
      description: ((p['description'] as string | undefined) ?? '').replace(/<[^>]+>/g, '').trim(),
      required: p['required'] ?? false,
    };
  }

  return result;
}

/**
 * Maps an HTTP header name to the CLI flag convention.
 * Check-* bypass headers use --skip-* for clarity.
 */
function headerNameToCliFlag(headerName: string): string {
  const overrides: Record<string, string> = {
    'Check-Certificate': '--skip-certificate-check',
    'Check-Client-CA-Certificate': '--skip-client-ca-certificate-check',
    'Check-Origin-Auth-Certificate': '--skip-origin-auth-certificate-check',
    'Check-Usage': '--skip-usage-check',
  };
  return overrides[headerName] ?? '--' + headerName.toLowerCase().replace(/\s+/g, '-');
}

export function getRequestBodySchema(path: string, method: string): { schema: unknown; required: boolean } {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  if (!op) return { schema: null, required: false };
  const content = ((op['requestBody'] as Record<string, unknown> | undefined)?.['content']) as Record<string, Record<string, unknown>> | undefined;
  const schema = content?.['application/json']?.['schema'] ?? null;
  return { schema, required: !!((op['requestBody'] as Record<string, unknown> | undefined)?.['required']) };
}

export function getResponseSchema(path: string, method: string): { schema: unknown; httpStatus: number } {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const responses = op?.['responses'] as Record<string, unknown> | undefined;
  const response = responses?.['200'] ?? responses?.['201'] ?? responses?.['204'];
  const content = ((response as Record<string, unknown> | undefined)?.['content']) as Record<string, Record<string, unknown>> | undefined;
  const status = responses?.['201'] ? 201 : responses?.['204'] ? 204 : 200;
  return { schema: content?.['application/json']?.['schema'] ?? null, httpStatus: status };
}

export function getQueryParameters(path: string, method: string): Record<string, unknown> | null {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const params = op?.['parameters'] as Array<Record<string, unknown>> | undefined;
  if (!params) return null;
  const result: Record<string, unknown> = {};
  for (const p of params) {
    if (p['in'] === 'query') {
      result[p['name'] as string] = { ...(p['schema'] as object), description: p['description'] };
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Returns a specific named example from the spec, or the first example if name is not found.
 * Returns null if no examples exist.
 */
export function getNamedSpecExample(path: string, method: string, name: string): unknown | null {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const content = (op?.['requestBody'] as Record<string, unknown> | undefined)?.['content'] as Record<string, Record<string, unknown>> | undefined;
  const mediaType = content?.['application/json'];
  if (!mediaType) return null;

  const examples = mediaType['examples'] as Record<string, { value: unknown }> | undefined;
  if (!examples) return null;

  if (examples[name]?.value !== undefined) return examples[name].value;
  // Fall back to first example
  const first = Object.values(examples)[0];
  return first?.value ?? null;
}

/**
 * Returns the first named example value, then singular example, then schema.example.
 * Returns null if no example is found (synthesize.ts handles fallback).
 */
export function getSpecExample(path: string, method: string): unknown | null {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const content = (op?.['requestBody'] as Record<string, unknown> | undefined)?.['content'] as Record<string, Record<string, unknown>> | undefined;
  const mediaType = content?.['application/json'];
  if (!mediaType) return null;

  const examples = mediaType['examples'] as Record<string, { value: unknown }> | undefined;
  if (examples) {
    const first = Object.values(examples)[0];
    if (first?.value !== undefined) return first.value;
  }

  if (mediaType['example'] !== undefined) return mediaType['example'];

  const schema = mediaType['schema'] as Record<string, unknown> | undefined;
  if (schema?.['example'] !== undefined) return schema['example'];

  return null;
}
