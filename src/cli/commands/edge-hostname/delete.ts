import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface DeleteOpts {
  skipUsageCheck?: boolean;
}

export function registerEdgeHostnameDeleteCommand(parent: Command): void {
  parent
    .command('delete <name>')
    .description('Delete an edge hostname')
    .option('--skip-usage-check', 'Send Check-Usage: no — skip dependency safety check')
    .action(async (name: string, opts: DeleteOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const headers: Record<string, string> = {};
        if (opts.skipUsageCheck) headers['Check-Usage'] = 'no';

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(Object.keys(headers).length > 0 ? { headers } : {}),
        };

        const data = await client.edgeHostnames.delete(name, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
