import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { print, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
  file?: string;
  example?: boolean;
}

export function registerAnnotationCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create an annotation')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/cdn/annotations', 'post');
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
        const validation = validateBody('/cdn/annotations', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro annotation create --example', globals.output);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.annotations.create(body, reqOptions);
        print(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
