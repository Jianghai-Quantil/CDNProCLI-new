import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError, CliError } from '../../errors';

interface ListOpts {
  from?: string;
  to?: string;
  type?: string;
  search?: string;
  limit?: string;
  offset?: string;
  all?: boolean;
}

export function registerAnnotationListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List annotations')
    .option('--from <date>', 'Start date (RFC 3339 UTC)')
    .option('--to <date>', 'End date (RFC 3339 UTC)')
    .option('--type <type>', 'Filter by type: client | configuration | operation')
    .option('--search <term>', 'Filter by ID or comment text')
    .option('--limit <n>', 'Page size [default: 10]')
    .option('--offset <n>', 'Page offset [default: 0]')
    .option('--all', 'Auto-paginate; implies --output jsonl')
    .action(async (opts: ListOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        // annotation list uses POST /cdn/annotationsList with a filter body
        const filters: Record<string, unknown> = {};
        if (opts.from) filters['startDate'] = opts.from;
        if (opts.to) filters['endDate'] = opts.to;
        if (opts.type) filters['type'] = opts.type;
        if (opts.search) filters['search'] = opts.search;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        if (opts.all) {
          const limit = 100;
          let offset = 0;
          while (true) {
            const data = await client.annotations.list({ ...filters, limit, offset }, reqOptions);
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
        const data = await client.annotations.list({ ...filters, limit, offset }, reqOptions);
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
