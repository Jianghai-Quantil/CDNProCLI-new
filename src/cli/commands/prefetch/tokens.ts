import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { print, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface TokensOpts {
  target?: string;
}

export function registerPrefetchTokensCommand(parent: Command): void {
  parent
    .command('tokens')
    .description('Get prefetch token quota information')
    .option('--target <env>', 'Filter by environment: staging | production')
    .action(async (opts: TokensOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.target) query['target'] = opts.target;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.prefetches.tokens(query, reqOptions);
        print(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
