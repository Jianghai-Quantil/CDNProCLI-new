/**
 * Maps CLI resource.operation keys to OpenAPI path + method.
 * Used by `cdnpro schema <resource> <operation>` (Phase 5.3).
 */
export declare const OPERATION_MAP: Record<string, {
    method: string;
    path: string;
}>;
/**
 * Looks up the OpenAPI path + method for a given "resource.operation" key.
 * Returns undefined if the operation is not found.
 */
export declare function lookupOperation(resource: string, operation: string): {
    method: string;
    path: string;
} | undefined;
//# sourceMappingURL=query.d.ts.map