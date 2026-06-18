import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface SummaryOpts {
  from?: string;
  to?: string;
  target?: string;
}

export function registerPurgeSummaryCommand(parent: Command): void {
  parent
    .command('summary')
    .description('Get purge usage summary')
    .option('--from <date>', 'Start date (RFC 3339 UTC)')
    .option('--to <date>', 'End date (RFC 3339 UTC)')
    .option('--target <env>', 'Filter by environment: staging | production')
    .action(async (opts: SummaryOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.from) query['startDate'] = opts.from;
        if (opts.to) query['endDate'] = opts.to;
        if (opts.target) query['target'] = opts.target;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.purges.summary(query, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
