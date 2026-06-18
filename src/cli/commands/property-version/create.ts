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

export function registerPropertyVersionCreateCommand(parent: Command): void {
  parent
    .command('create [propertyId]')
    .description('Create a new version of a property')
    .option('--file <path>', 'JSON body file (use - for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (propertyId: string | undefined, opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/properties/{propertyID}/versions', 'post');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        checkRequiredOption(opts.file, '--file <path>');
        checkRequiredOption(propertyId, 'propertyId');

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/properties/{propertyID}/versions', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro property-version create --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const raw = await client.properties.createVersion(propertyId, body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
        const data = enrichWithLocationId(raw);
        const id = data['id'] as string;

        printCreateSuccess('Property Version', 'propertyVersionId', id, globals.output);
      } catch (err) {
        handleError(err);
      }
    });
}
