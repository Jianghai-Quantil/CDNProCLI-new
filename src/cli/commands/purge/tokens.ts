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

export const PURGE_TOKENS_OPTIONS: OptionMapping[] = [
  { flag: '--target <env>', target: 'query', param: 'target', description: 'Filter by environment: staging | production' },
];

export function registerPurgeTokensCommand(parent: Command): void {
  const cmd = parent
    .command('tokens')
    .description('Get purge token quota information');

  registerOptionsFromMapping(cmd, PURGE_TOKENS_OPTIONS);
  registerMappings('purge', 'tokens', PURGE_TOKENS_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query } = buildRequestFromMapping(opts, PURGE_TOKENS_OPTIONS);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.purges.tokens(query, reqOptions);
      printResult(data, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
