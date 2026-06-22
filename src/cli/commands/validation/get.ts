import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { registerMappings } from '../../option-map';

export function registerValidationGetCommand(parent: Command): void {
  registerMappings('validation', 'get', []);

  parent
    .command('get <id>')
    .description('Get a validation task by ID')
    .action(async (id: string, _opts: unknown, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.validations.get(id, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
