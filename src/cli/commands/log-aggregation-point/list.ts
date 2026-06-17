import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface ListOpts {
  search?: string;
}

export function registerLogAggregationPointListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List log aggregation points')
    .option('--search <term>', 'Keyword search')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.search) query['search'] = opts.search;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.logAggregationPoints.list(query, reqOptions);
        const { items, meta } = buildMeta(data);

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(items);
        } else if (effectiveFmt === 'jsonl') {
          printJsonl(items);
        } else {
          printJson(items, meta);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
