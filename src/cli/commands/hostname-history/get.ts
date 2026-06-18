import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface GetOpts {
  from?: string;
  to?: string;
  target?: string;
}

export function registerHostnameHistoryGetCommand(parent: Command): void {
  parent
    .command('get <hostname>')
    .description('Get deployment history for a specific hostname')
    .option('--from <date>', 'Start date (RFC 3339 UTC)')
    .option('--to <date>', 'End date (RFC 3339 UTC)')
    .option('--target <target>', 'Filter by deployment target: staging | production | all')
    .action(async (hostname: string, opts: GetOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.from) query['from'] = opts.from;
        if (opts.to) query['to'] = opts.to;
        if (opts.target) query['target'] = opts.target;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.hostnameHistory.get(hostname, query, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
