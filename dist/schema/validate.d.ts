import { ErrorObject } from 'ajv';
export interface ValidationResult {
    valid: boolean;
    errors: ErrorObject[];
    schema: unknown;
}
/**
 * Validates a request body against the JSON Schema for the given OpenAPI path + method.
 * Returns valid=true and empty errors when no schema is found for the operation.
 */
export declare function validateBody(openapiPath: string, method: string, body: unknown): ValidationResult;
//# sourceMappingURL=validate.d.ts.map