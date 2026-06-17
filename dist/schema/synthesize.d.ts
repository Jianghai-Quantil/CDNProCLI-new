/**
 * Returns an example body for the given operation.
 * Priority: spec named examples → spec singular example → schema.example → synthesized.
 */
export declare function getExampleBody(openapiPath: string, method: string): unknown;
/**
 * Synthesis rules (applied recursively).
 * Optional properties are prefixed with "_optional_" so agents know they can be dropped.
 */
export declare function synthesizeFromSchema(schema: Record<string, unknown>, key?: string, _seen?: Set<string>): unknown;
//# sourceMappingURL=synthesize.d.ts.map