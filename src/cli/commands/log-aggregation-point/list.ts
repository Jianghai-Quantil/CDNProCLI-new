import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import {
  OptionMapping,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

interface ListOpts {
  search?: string;
}

export function registerLogAggregationPointListCommand(parent: Command): void {
  const LOG_AGGREGATION_POINT_LIST_OPTIONS: OptionMapping[] = [
    { flag: '--search <term>', target: 'query', param: 'search', description: 'Keyword search' },
  ];
  registerMappings('log-aggregation-point', 'list', LOG_AGGREGATION_POINT_LIST_OPTIONS);

  const cmd = parent
    .command('list')
    .description('List log aggregation points');
  registerOptionsFromMapping(cmd, LOG_AGGREGATION_POINT_LIST_OPTIONS);
  cmd.action(async (opts: ListOpts, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
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
