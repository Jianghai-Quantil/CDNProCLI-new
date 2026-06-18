import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { print, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
  file?: string;
  example?: boolean;
}

export function registerLogConfigCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a log delivery configuration')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/report/logConfigs', 'post');
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
        const validation = validateBody('/cdn/report/logConfigs', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro log-config create --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const raw = await client.logConfigs.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
        const data = enrichWithLocationId(raw);
        print(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
