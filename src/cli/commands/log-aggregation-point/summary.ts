import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { registerMappings } from '../../option-map';

export function registerLogAggregationPointSummaryCommand(parent: Command): void {
  const cmd = parent
    .command('summary')
    .description('Get log aggregation point summary report');

  registerMappings('log-aggregation-point', 'summary', []);

  cmd.action(async (opts: Record<string, unknown>, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.logAggregationPoints.summary(reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
