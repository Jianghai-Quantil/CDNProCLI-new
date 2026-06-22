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

const CLIENT_REGION_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--search <term>',    target: 'query', param: 'search',    description: 'Keyword search' },
  { flag: '--isp-code <code>',   target: 'query', param: 'ispCode',   description: 'Filter by ISP code' },
  { flag: '--sort-order <order>', target: 'query', param: 'sortOrder', description: 'Sort order: asc | desc' },
];

export function registerClientRegionCommands(parent: Command): void {
  const cmd = parent
    .command('client-region')
    .description('List client regions (read-only reference data)');

  const listCmd = cmd
    .command('list')
    .description('List client regions');

  registerOptionsFromMapping(listCmd, CLIENT_REGION_LIST_OPTIONS);
  registerMappings('client-region', 'list', CLIENT_REGION_LIST_OPTIONS);

  listCmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query } = buildRequestFromMapping(opts, CLIENT_REGION_LIST_OPTIONS);

      const data = await client.geo.clientRegions(query);
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
