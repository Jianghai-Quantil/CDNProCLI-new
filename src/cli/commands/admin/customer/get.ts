import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../../output';
import { handleError } from '../../../errors';
import { registerMappings } from '../../../option-map';

export function registerAdminCustomerGetCommand(parent: Command): void {
  registerMappings('customer', 'get', []);

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
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
