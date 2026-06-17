import { Command } from 'commander';
import * as readline from 'readline';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';

interface DeleteOpts {
  confirm?: boolean;
}

export function registerPropertyDeleteCommand(parent: Command): void {
  parent
    .command('delete <id>')
    .description('Delete a property')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (id: string, opts: DeleteOpts, cmd: Command) => {
      try {
        if (!opts.confirm && process.stdout.isTTY) {
          const answer = await new Promise<string>((resolve) => {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(`Delete property "${id}"? [y/N] `, (ans) => { rl.close(); resolve(ans); });
          });
          if (answer.toLowerCase() !== 'y') {
            process.stderr.write('Aborted.\n');
            process.exit(0);
          }
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        await client.properties.delete(id, reqOptions);

        if (!process.stdout.isTTY || globals.output) {
          process.stdout.write(JSON.stringify({ success: true, propertyId: id }) + '\n');
        } else {
          process.stderr.write(`Property ${id} deleted.\n`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
