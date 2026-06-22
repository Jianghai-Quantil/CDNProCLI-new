import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import {
  OptionMapping,
  SORT_OPTIONS,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

export const SHIELD_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--search <term>',           target: 'query', param: 'search',          description: 'Keyword search' },
  { flag: '--used-in-properties',      target: 'query', param: 'usedInProperties', description: 'Filter to shields referenced by at least one property', boolean: true },
  ...SORT_OPTIONS,
];

export function registerShieldListCommand(parent: Command): void {
  const cmd = parent
    .command('list')
    .description('List origin shields');

  registerOptionsFromMapping(cmd, SHIELD_LIST_OPTIONS);
  registerMappings('shield', 'list', SHIELD_LIST_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query, reqOptions: mappedReqOptions } = buildRequestFromMapping(opts, SHIELD_LIST_OPTIONS);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...mappedReqOptions,
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.shields.list(query, reqOptions);
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
