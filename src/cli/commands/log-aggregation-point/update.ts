import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface UpdateOpts {
  file?: string;
  example?: boolean;
  ifUnmodifiedSince?: string;
}

export function registerLogAggregationPointUpdateCommand(parent: Command): void {
  parent
    .command('update <id>')
    .description('Update a log aggregation point (PATCH)')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .option('--if-unmodified-since <date>', 'Optimistic concurrency guard (If-Unmodified-Since header)')
    .action(async (id: string, opts: UpdateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/logAggregationPoints/{id}', 'patch');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        if (!opts.file) {
          process.stderr.write("Error: required option '--file <path>' not specified\n");
          process.exit(1);
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/logAggregationPoints/{id}', 'patch', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro log-aggregation-point update --example', globals.output);

        const headers: Record<string, string> = {};
        if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(Object.keys(headers).length > 0 ? { headers } : {}),
        };

        const data = await client.logAggregationPoints.update(id, body, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
