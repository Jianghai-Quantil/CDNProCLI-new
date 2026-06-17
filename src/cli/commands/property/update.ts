import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface UpdateOpts {
  file?: string;
  ifUnmodifiedSince?: string;
  example?: boolean;
}

export function registerPropertyUpdateCommand(parent: Command): void {
  parent
    .command('update <id>')
    .description('Update a property (PATCH)')
    .option('--file <path>', 'JSON body file (use - for stdin)')
    .option('--if-unmodified-since <date>', 'If-Unmodified-Since header (RFC 1123); server returns 412 if modified since')
    .option('--example', 'Print an example request body and exit')
    .action(async (id: string, opts: UpdateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/properties/{propertyID}', 'patch');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        if (!opts.file) {
          process.stderr.write('Error: --file <path> is required (use - for stdin)\n');
          process.exit(1);
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/properties/{propertyID}', 'patch', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro property update --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(opts.ifUnmodifiedSince
            ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } }
            : {}),
        };

        await client.properties.update(id, body, reqOptions);
        // 204 No Content — emit a minimal success response
        if (!process.stdout.isTTY || globals.output) {
          process.stdout.write(JSON.stringify({ success: true }) + '\n');
        } else {
          process.stderr.write(`Property ${id} updated.\n`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
