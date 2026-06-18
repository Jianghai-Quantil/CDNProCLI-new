import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
  file?: string;
  example?: boolean;
}

export function registerPropertyCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new property')
    .option('--file <path>', 'JSON body file (use - for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/properties', 'post');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        checkRequiredOption(opts.file, '--file <path>');

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/properties', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro property create --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const raw = await client.properties.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
        const data = enrichWithLocationId(raw);
        const id = data['id'] as string;

        printCreateSuccess('Property', 'propertyId', id, globals.output);
      } catch (err) {
        handleError(err);
      }
    });
}
