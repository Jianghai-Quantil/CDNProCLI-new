import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import {
  OptionMapping,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

const ISP_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--search <term>',     target: 'query', param: 'search',     description: 'Keyword search' },
  { flag: '--region-code <code>', target: 'query', param: 'regionCode', description: 'Filter by region code' },
  { flag: '--sort-order <order>', target: 'query', param: 'sortOrder',  description: 'Sort order: asc | desc' },
];

export function registerIspCommands(parent: Command): void {
  const cmd = parent
    .command('isp')
    .description('List ISPs (read-only reference data)');

  const listCmd = cmd
    .command('list')
    .description('List ISPs');

  registerOptionsFromMapping(listCmd, ISP_LIST_OPTIONS);
  registerMappings('isp', 'list', ISP_LIST_OPTIONS);

  listCmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query } = buildRequestFromMapping(opts, ISP_LIST_OPTIONS);

      const data = await client.geo.isps(query);
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
