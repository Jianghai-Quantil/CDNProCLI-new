import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import {
  OptionMapping,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

export const PURGE_SUMMARY_OPTIONS: OptionMapping[] = [
  { flag: '--from <date>',  target: 'query', param: 'startDate', description: 'Start date (RFC 3339 UTC)' },
  { flag: '--to <date>',    target: 'query', param: 'endDate',   description: 'End date (RFC 3339 UTC)' },
  { flag: '--target <env>', target: 'query', param: 'target',    description: 'Filter by environment: staging | production' },
];

export function registerPurgeSummaryCommand(parent: Command): void {
  const cmd = parent
    .command('summary')
    .description('Get purge usage summary');

  registerOptionsFromMapping(cmd, PURGE_SUMMARY_OPTIONS);
  registerMappings('purge', 'summary', PURGE_SUMMARY_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query } = buildRequestFromMapping(opts, PURGE_SUMMARY_OPTIONS);

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
