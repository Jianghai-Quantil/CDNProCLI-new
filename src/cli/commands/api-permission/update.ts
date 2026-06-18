import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from "../../util";
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface UpdateOpts {
  file?: string;
  example?: boolean;
  ifUnmodifiedSince?: string;
}

export function registerApiPermissionUpdateCommand(parent: Command): void {
  parent
    .command('update [id]')
    .description('Update an API permission set (PATCH)')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .option('--if-unmodified-since <date>', 'Optimistic concurrency guard (If-Unmodified-Since header)')
    .action(async (id: string | undefined, opts: UpdateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/apiPermissions/{id}', 'patch');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        checkRequiredOption(opts.file, "--file <path>");
        checkRequiredOption(id, 'id');

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);

        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/apiPermissions/{id}', 'patch', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro api-permission update --example', globals.output);

        const headers: Record<string, string> = {};
        if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(Object.keys(headers).length > 0 ? { headers } : {}),
        };

        await client.apiPermissions.update(id, body, reqOptions);
        if (!process.stdout.isTTY || globals.output) {
          process.stdout.write(JSON.stringify({ success: true }) + '\n');
        } else {
          process.stderr.write(`API permission ${id} updated.\n`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
