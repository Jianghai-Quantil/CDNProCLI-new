import { getSpec, getSpecExample, getRequestBodySchema } from './loader';

/**
 * Returns an example body for the given operation.
 * Priority: spec named examples → spec singular example → schema.example → synthesized.
 */
export function getExampleBody(openapiPath: string, method: string): unknown {
  const specExample = getSpecExample(openapiPath, method);
  if (specExample !== null) return specExample;

  const { schema } = getRequestBodySchema(openapiPath, method);
  if (!schema) return null;
  return synthesizeFromSchema(schema as Record<string, unknown>);
}

/**
 * Synthesis rules (applied recursively).
 * Optional properties are prefixed with "_optional_" so agents know they can be dropped.
 */
export function synthesizeFromSchema(
  schema: Record<string, unknown>,
  key = 'value',
  _seen = new Set<string>(),
): unknown {
  if (!schema || typeof schema !== 'object') return null;

  if (schema['$ref']) {
    const ref = schema['$ref'] as string;
    if (_seen.has(ref)) return `<recursive:${ref}>`;
    _seen.add(ref);
    const resolved = resolveRef(ref);
    return resolved ? synthesizeFromSchema(resolved, key, _seen) : null;
  }

  const type = schema['type'] as string | undefined;

  if (type === 'object' || schema['properties']) {
    const props = (schema['properties'] as Record<string, unknown> | undefined) ?? {};
    const required = (schema['required'] as string[] | undefined) ?? [];
    const result: Record<string, unknown> = {};
    for (const reqKey of required) {
      result[reqKey] = synthesizeFromSchema((props[reqKey] as Record<string, unknown>) ?? {}, reqKey, _seen);
    }
    for (const [optKey, optSchema] of Object.entries(props)) {
      if (!required.includes(optKey)) {
        result[`_optional_${optKey}`] = synthesizeFromSchema(optSchema as Record<string, unknown>, optKey, _seen);
      }
    }
    return result;
  }

  if (type === 'array') {
    const items = schema['items'] as Record<string, unknown> | undefined;
    return [items ? synthesizeFromSchema(items, key, _seen) : null];
  }

  if (type === 'string') {
    if (schema['enum']) return (schema['enum'] as unknown[])[0];
    if (schema['format'] === 'date-time') return '2026-01-01T00:00:00Z';
    if (schema['format'] === 'date') return '2026-01-01';
    return `<${key}>`;
  }

  if (type === 'integer' || type === 'number') {
    return (schema['minimum'] as number | undefined) ?? 0;
  }

  if (type === 'boolean') return false;

  return null;
}

function resolveRef(ref: string): Record<string, unknown> | null {
  const spec = getSpec();
  const parts = ref.replace(/^#\//, '').split('/');
  let node: unknown = spec;
  for (const part of parts) {
    node = (node as Record<string, unknown>)[part];
    if (node === undefined) return null;
  }
  return node as Record<string, unknown>;
}
