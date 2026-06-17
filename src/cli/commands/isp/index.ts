import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface ListOpts {
  search?: string;
  regionCode?: string;
  sortOrder?: string;
}

export function registerIspCommands(parent: Command): void {
  const cmd = parent
    .command('isp')
    .description('List ISPs (read-only reference data)');

  cmd
    .command('list')
    .description('List ISPs')
    .option('--search <term>', 'Keyword search')
    .option('--region-code <code>', 'Filter by region code')
    .option('--sort-order <order>', 'Sort order: asc | desc')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.search) query['search'] = opts.search;
        if (opts.regionCode) query['regionCode'] = opts.regionCode;
        if (opts.sortOrder) query['sortOrder'] = opts.sortOrder;

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
