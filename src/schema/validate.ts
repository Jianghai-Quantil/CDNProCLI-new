import Ajv, { ErrorObject } from 'ajv';
import { getRequestBodySchema } from './loader';

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
  schema: unknown; // the resolved schema — included in JSON error envelopes (5.5)
}

let _ajv: Ajv | null = null;

function getAjv(): Ajv {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true, strict: false });
  }
  return _ajv;
}

/**
 * Validates a request body against the JSON Schema for the given OpenAPI path + method.
 * Returns valid=true and empty errors when no schema is found for the operation.
 */
export function validateBody(
  openapiPath: string,
  method: string,
  body: unknown,
): ValidationResult {
  const { schema } = getRequestBodySchema(openapiPath, method);
  if (!schema) return { valid: true, errors: [], schema: null };

  const ajv = getAjv();
  const valid = ajv.validate(schema as object, body) as boolean;
  const errors = ajv.errors ? [...ajv.errors] : [];
  return { valid, errors, schema };
}
