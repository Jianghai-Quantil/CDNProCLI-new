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
//# sourceMappingURL=util.d.ts.map