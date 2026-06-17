import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
  file?: string;
  example?: boolean;
}

export function registerPropertyVersionCreateCommand(parent: Command): void {
  parent
    .command('create <propertyId>')
    .description('Create a new version of a property')
    .option('--file <path>', 'JSON body file (use - for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (propertyId: string, opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/properties/{propertyID}/versions', 'post');
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
        const fmt = globals.output as OutputFormat | undefined;
        const body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/properties/{propertyID}/versions', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro property-version create --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.properties.createVersion(propertyId, body, reqOptions);

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(data);
        } else {
          printJson(data);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
