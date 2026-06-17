export declare const EXIT_CODES: {
    readonly SUCCESS: 0;
    readonly ERROR: 1;
    readonly AUTH_ERROR: 2;
    readonly NOT_FOUND: 3;
    readonly VALIDATION: 4;
    readonly FORBIDDEN: 5;
    readonly RATE_LIMITED: 6;
    readonly SERVER_ERROR: 7;
    readonly TIMEOUT: 8;
    readonly CONFIG_ERROR: 9;
    readonly PRECONDITION_FAILED: 10;
};
export type ExitCodeKey = keyof typeof EXIT_CODES;
export declare class CliError extends Error {
    readonly code: ExitCodeKey;
    readonly details?: unknown | undefined;
    /** When true, handleError skips printing (output was already emitted). */
    readonly silent: boolean;
    constructor(code: ExitCodeKey, message: string, details?: unknown | undefined, 
    /** When true, handleError skips printing (output was already emitted). */
    silent?: boolean);
}
export declare function handleError(err: unknown): never;
//# sourceMappingURL=errors.d.ts.map