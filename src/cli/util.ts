import * as fs from 'fs';
import { CliError } from './errors';
import { ValidationResult } from '../schema/validate';

/**
 * Read a JSON body from a file path or stdin ("-").
 * Throws CliError if the path is unreadable or the content is not valid JSON.
 */
export function readBodyFile(filePath: string): unknown {
  let raw: string;
  try {
    raw = filePath === '-'
      ? fs.readFileSync(process.stdin.fd, 'utf8')
      : fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new CliError('ERROR', `Cannot read "${filePath}": ${(e as Error).message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new CliError('VALIDATION', `"${filePath}" is not valid JSON: ${(e as Error).message}`);
  }
}

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
export function emitValidationError(
  result: ValidationResult,
  hint: string,
  output?: string,
): never {
  const errors = result.errors;
  const isHuman = output == null ? process.stdout.isTTY : output === 'table';

  if (isHuman) {
    process.stderr.write('Error: Invalid request body\n');
    for (const e of errors) {
      process.stderr.write(`  - ${e.instancePath || 'body'}: ${e.message}\n`);
    }
    process.stderr.write(`\nTip: run \`${hint}\` for a valid template\n`);
  } else {
    const count = errors.length;
    const envelope = {
      error: {
        code: 'VALIDATION',
        message: `Request body failed schema validation (${count} error${count !== 1 ? 's' : ''})`,
        validationErrors: errors.map(e => ({
          path: e.instancePath || '',
          message: e.message ?? '',
          keyword: e.keyword,
          params: e.params,
        })),
        schema: result.schema,
        hint: `Run \`${hint}\` to see a valid body template`,
      },
    };
    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
  }

  throw new CliError('VALIDATION', 'Invalid request body', undefined, true);
}

/**
 * Given a raw API response, extract the resource ID from the Location header
 * and enrich the response body with it.  Many CDN Pro POST endpoints return
 * the new resource's URL in the Location header rather than in the body.
 */
export function enrichWithLocationId(
  raw: { obj: unknown; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } },
): Record<string, unknown> {
  const data = (raw.obj ?? {}) as Record<string, unknown>;
  if (data['id'] !== undefined && data['id'] !== null) return data;
  const location = raw.ctx._res.headers['location'] as string | undefined;
  if (!location) return data;
  const id = location.split('/').pop();
  if (id) {
    return { ...data, id };
  }
  return data;
}
