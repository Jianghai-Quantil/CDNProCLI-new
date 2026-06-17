import openapiRaw from '../../openapi.json';
export declare function getSpec(): typeof openapiRaw;
/**
 * Returns all header parameters for an operation as a requestHeaders map.
 * Each entry includes the cliFlag derived from the header name.
 */
export declare function getRequestHeaders(openapiPath: string, method: string): Record<string, unknown>;
export declare function getRequestBodySchema(path: string, method: string): {
    schema: unknown;
    required: boolean;
};
export declare function getResponseSchema(path: string, method: string): {
    schema: unknown;
    httpStatus: number;
};
export declare function getQueryParameters(path: string, method: string): Record<string, unknown> | null;
/**
 * Returns a specific named example from the spec, or the first example if name is not found.
 * Returns null if no examples exist.
 */
export declare function getNamedSpecExample(path: string, method: string, name: string): unknown | null;
/**
 * Returns the first named example value, then singular example, then schema.example.
 * Returns null if no example is found (synthesize.ts handles fallback).
 */
export declare function getSpecExample(path: string, method: string): unknown | null;
//# sourceMappingURL=loader.d.ts.map