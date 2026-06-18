import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../../output';
import { handleError } from '../../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId } from '../../../util';
import { getExampleBody } from '../../../../schema/synthesize';
import { validateBody } from '../../../../schema/validate';

interface CreateOpts {
  file?: string;
  example?: boolean;
}

export function registerAdminCustomerCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a customer')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/ngadmin/customers', 'post');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        if (!opts.file) {
          process.stderr.write('Error: required option \'--file <path>\' not specified\n');
          process.exit(1);
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const body = readBodyFile(opts.file);
        const validation = validateBody('/ngadmin/customers', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro admin customer create --example', globals.output);

        const reqOptions = {
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const raw = await client.customers.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
        const data = enrichWithLocationId(raw);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
