import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from "../../util";
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface ReplaceOpts {
  file?: string;
  example?: boolean;
  ifUnmodifiedSince?: string;
}

export function registerEdgeHostnameReplaceCommand(parent: Command): void {
  parent
    .command('replace [name]')
    .description('Fully replace an edge hostname (PUT)')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .option('--if-unmodified-since <date>', 'Optimistic concurrency guard (If-Unmodified-Since header)')
    .action(async (name: string | undefined, opts: ReplaceOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/edgeHostnames/{edgeHostname}', 'put');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        checkRequiredOption(opts.file, "--file <path>");
        checkRequiredOption(name, 'name');

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/edgeHostnames/{edgeHostname}', 'put', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro edge-hostname replace --example', globals.output);

        const headers: Record<string, string> = {};
        if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(Object.keys(headers).length > 0 ? { headers } : {}),
        };

        await client.edgeHostnames.replace(name, body, reqOptions);
        if (!process.stdout.isTTY || globals.output) {
          process.stdout.write(JSON.stringify({ success: true }) + '\n');
        } else {
          process.stderr.write(`Edge hostname ${name} replaced.\n`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
