import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';

export function registerDeployGetCommand(parent: Command): void {
  parent
    .command('get <id>')
    .description('Get a deployment task by ID')
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

        const data = await client.deploymentTasks.get(id, reqOptions);
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
