import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { print, OutputFormat } from '../../../output';
import { handleError } from '../../../errors';

export function registerAdminCustomerGetCommand(parent: Command): void {
  parent
    .command('get <id>')
    .description('Get a customer by ID')
    .action(async (id: string, opts: Record<string, unknown>, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const reqOptions = {
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.customers.get(id, reqOptions);
        print(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
