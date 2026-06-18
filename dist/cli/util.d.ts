import { ValidationResult } from '../schema/validate';
/**
 * Read a JSON body from a file path or stdin ("-").
 * Throws CliError if the path is unreadable or the content is not valid JSON.
 */
export declare function readBodyFile(filePath: string): unknown;
/**
 * Formats and emits a validation failure, then throws a CliError (exit code 4).
 *
 * In table/TTY mode: human-readable error lines on stderr.
 * In JSON mode: machine-readable envelope on stdout with the full schema
 *   so an AI agent can self-correct without a second round-trip.
 *
 * @param result   - The ValidationResult from validateBody()
 * @param hint     - The full `cdnpro <resource> <operation> --example` command string for the hint message
 * @param output   - The --output flag value (undefined = auto-detect from isTTY)
 */
export declare function emitValidationError(result: ValidationResult, hint: string, output?: string): never;
/**
 * Validates that a required option is present.  Use this instead of
 * Commander's `.requiredOption()` whenever the command also supports
 * `--example`, because `.requiredOption()` rejects the command before
 * the action handler gets a chance to handle `--example`.
 */
export declare function checkRequiredOption(value: string | undefined, flagName: string): asserts value is string;
/**
 * Given a raw API response, extract the resource ID from the Location header
 * and enrich the response body with it.  Many CDN Pro POST endpoints return
 * the new resource's URL in the Location header rather than in the body.
 */
export declare function enrichWithLocationId(raw: {
    obj: unknown;
    ctx: {
        _res: {
            headers: Record<string, string | string[] | undefined>;
        };
    };
}): Record<string, unknown>;
//# sourceMappingURL=util.d.ts.map