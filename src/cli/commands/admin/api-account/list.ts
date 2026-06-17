import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../../output';
import { handleError, CliError } from '../../../errors';

interface ListOpts {
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: string;
  offset?: string;
  all?: boolean;
  reportRange?: string;
}

export function registerAdminApiAccountListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List API accounts')
    .option('--search <term>', 'Keyword search')
    .option('--type <type>', 'Filter by type: operator | read-only')
    .option('--sort-by <field>', 'Sort field: creationTime | lastUpdateTime')
    .option('--sort-order <order>', 'Sort order: asc | desc')
    .option('--limit <n>', 'Page size [default: 10]')
    .option('--offset <n>', 'Page offset [default: 0]')
    .option('--all', 'Auto-paginate; implies --output jsonl')
    .option('--report-range <scope>', 'Report-Range header: self-only | self+children | children-only')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.search) query['search'] = opts.search;
        if (opts.type) query['type'] = opts.type;
        if (opts.sortBy) query['sortBy'] = opts.sortBy;
        if (opts.sortOrder) query['sortOrder'] = opts.sortOrder;

        const reqOptions = {
          ...(opts.reportRange ? { reportRange: opts.reportRange } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        if (opts.all) {
          const limit = 100;
          let offset = 0;
          while (true) {
            const data = await client.apiAccounts.list({ ...query, limit, offset }, reqOptions);
            const { items } = buildMeta(data);
            if (items.length === 0) break;
            printJsonl(items);
            if (items.length < limit) break;
            offset += limit;
          }
          return;
        }

        const limit = parseInt(opts.limit ?? '10', 10);
        if (isNaN(limit) || limit < 1) {
          throw new CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
        }
        const offset = parseInt(opts.offset ?? '0', 10);
        if (isNaN(offset) || offset < 0) {
          throw new CliError('VALIDATION', `--offset must be a non-negative integer, got: ${opts.offset}`);
        }
        const data = await client.apiAccounts.list({ ...query, limit, offset }, reqOptions);
        const { items, meta } = buildMeta(data);
        meta.limit = limit;
        meta.offset = offset;

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
