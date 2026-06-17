import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface ListOpts {
  search?: string;
  usedInProperties?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export function registerShieldListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List origin shields')
    .option('--search <term>', 'Keyword search')
    .option('--used-in-properties', 'Filter to shields referenced by at least one property')
    .option('--sort-by <field>', 'Sort field: lastUpdated | effectiveDate')
    .option('--sort-order <order>', 'Sort order: asc | desc')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.search) query['search'] = opts.search;
        if (opts.usedInProperties) query['usedInProperties'] = true;
        if (opts.sortBy) query['sortBy'] = opts.sortBy;
        if (opts.sortOrder) query['sortOrder'] = opts.sortOrder;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
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
