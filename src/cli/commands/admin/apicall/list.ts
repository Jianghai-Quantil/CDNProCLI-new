import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../../output';
import { handleError, CliError } from '../../../errors';

interface ListOpts {
  from?: string;
  to?: string;
  method?: string;
  path?: string;
  safe?: string;
  caller?: string;
  forCustomer?: string;
  status?: string;
  before?: string;
  limit?: string;
  all?: boolean;
  reportRange?: string;
}

export function registerAdminApiCallListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List API call log entries')
    .option('--from <date>', 'Start date (RFC 3339 UTC or relative: 7d, 24H, 1M)')
    .option('--to <date>', 'End date (RFC 3339 UTC or relative)')
    .option('--method <method>', 'Filter by HTTP method: GET | POST | PATCH | PUT | DELETE')
    .option('--path <uri>', 'Filter by API path')
    .option('--safe <bool>', 'Filter by safe flag: true | false')
    .option('--caller <name-or-id>', 'Filter by API account name or ID')
    .option('--for-customer <id>', 'Filter by on-behalf-of customer: customer ID | none | any')
    .option('--status <code,...>', 'Filter by HTTP status codes or patterns (2xx, 4xx, etc.)')
    .option('--before <apiRequestId>', 'Cursor for pagination: return calls before this request ID')
    .option('--limit <n>', 'Page size [default: 100, max: 100]')
    .option('--all', 'Auto-paginate using cursor (--before); implies --output jsonl')
    .option('--report-range <scope>', 'Report-Range header: self-only | self+children | children-only')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.from) query['startdate'] = opts.from;
        if (opts.to) query['enddate'] = opts.to;
        if (opts.method) query['method'] = opts.method;
        if (opts.path) query['path'] = opts.path;
        if (opts.safe !== undefined) query['safe'] = opts.safe;
        if (opts.caller) query['caller'] = opts.caller;
        if (opts.forCustomer) query['forCustomer'] = opts.forCustomer;
        if (opts.status) query['status'] = opts.status;

        const reqOptions = {
          ...(opts.reportRange ? { reportRange: opts.reportRange } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const limit = parseInt(opts.limit ?? '100', 10);
        if (isNaN(limit) || limit < 1) {
          throw new CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
        }

        if (opts.all) {
          let before: string | undefined;
          while (true) {
            const pageQuery = { ...query, limit, ...(before ? { before } : {}) };
            const data = await client.apiCalls.list(pageQuery, reqOptions);
            const { items } = buildMeta(data);
            if (items.length === 0) break;
            printJsonl(items);
            if (items.length < limit) break;
            // Use the last item's apiRequestId as the cursor
            const last = items[items.length - 1] as Record<string, unknown>;
            before = last['apiRequestId'] as string | undefined;
            if (!before) break;
          }
          return;
        }

        const pageQuery: Record<string, unknown> = { ...query, limit };
        if (opts.before) pageQuery['before'] = opts.before;

        const data = await client.apiCalls.list(pageQuery, reqOptions);
        const { items, meta } = buildMeta(data);
        meta.limit = limit;

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
