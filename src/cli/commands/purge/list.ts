import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError, CliError } from '../../errors';

interface ListOpts {
  from?: string;
  to?: string;
  target?: string;
  action?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  maxSuccessRate?: string;
  limit?: string;
  offset?: string;
  all?: boolean;
  reportRange?: string;
}

export function registerPurgeListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List purge requests')
    .option('--from <date>', 'Start date (RFC 3339 UTC)')
    .option('--to <date>', 'End date (RFC 3339 UTC)')
    .option('--target <env>', 'Filter by environment: staging | production')
    .option('--action <action>', 'Filter by purge action: invalidate | delete')
    .option('--search <term>', 'Match on hostname or purge task ID')
    .option('--sort-by <field>', 'Sort field: submissionTime | finishTime')
    .option('--sort-order <order>', 'Sort direction: asc | desc')
    .option('--max-success-rate <rate>', 'Filter by max success rate (0–1)')
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
        if (opts.from) query['startDate'] = opts.from;
        if (opts.to) query['endDate'] = opts.to;
        if (opts.target) query['target'] = opts.target;
        if (opts.action) query['action'] = opts.action;
        if (opts.search) query['search'] = opts.search;
        if (opts.sortBy) query['sortBy'] = opts.sortBy;
        if (opts.sortOrder) query['sortOrder'] = opts.sortOrder;
        if (opts.maxSuccessRate) query['maxSuccessRate'] = opts.maxSuccessRate;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(opts.reportRange ? { reportRange: opts.reportRange } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        if (opts.all) {
          const limit = 100;
          let offset = 0;
          while (true) {
            const data = await client.purges.list({ ...query, limit, offset }, reqOptions);
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
        const data = await client.purges.list({ ...query, limit, offset }, reqOptions);
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
