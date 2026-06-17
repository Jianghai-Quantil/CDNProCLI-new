import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { print, OutputFormat } from '../../../output';
import { handleError } from '../../../errors';
import { readBodyFile, emitValidationError } from '../../../util';
import { getExampleBody } from '../../../../schema/synthesize';
import { validateBody } from '../../../../schema/validate';

interface UpdateOpts {
  file?: string;
  example?: boolean;
}

export function registerAdminContactUpdateCommand(parent: Command): void {
  parent
    .command('update <id>')
    .description('Update a contact (PATCH)')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (id: string, opts: UpdateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/ngadmin/contacts/{id}', 'patch');
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
        const validation = validateBody('/ngadmin/contacts/{id}', 'patch', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro admin contact update --example', globals.output);

        const reqOptions = {
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.contacts.update(id, body, reqOptions);
        print(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
