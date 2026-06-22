import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../../output';
import { handleError, CliError } from '../../../errors';
import {
  OptionMapping,
  PAGINATION_OPTIONS,
  SORT_OPTIONS,
  ALL,
  registerOptionsFromMapping,
  registerMappings,
} from '../../../option-map';

interface ListOpts {
  search?: string;
  ids?: string;
  status?: string;
  products?: string;
  regionalOffices?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: string;
  offset?: string;
  all?: boolean;
}

export function registerAdminCustomerListCommand(parent: Command): void {
  const ADMIN_CUSTOMER_LIST_OPTIONS: OptionMapping[] = [
    { flag: '--search <term>',                   target: 'query', param: 'search',           description: 'Keyword search' },
    { flag: '--ids <id,...>',                     target: 'query', param: 'ids',              description: 'Comma-separated customer IDs to filter' },
    { flag: '--status <status>',                  target: 'query', param: 'status',           description: 'Filter by status: active | suspended' },
    { flag: '--products <product,...>',           target: 'query', param: 'products',         description: 'Filter by product codes' },
    { flag: '--regional-offices <office,...>',    target: 'query', param: 'regionalOffices',  description: 'Filter by regional office codes' },
    ...SORT_OPTIONS,
    ...PAGINATION_OPTIONS,
    ALL,
  ];
  registerMappings('admin-customer', 'list', ADMIN_CUSTOMER_LIST_OPTIONS);

  const cmd = parent
    .command('list')
    .description('List customers');
  registerOptionsFromMapping(cmd, ADMIN_CUSTOMER_LIST_OPTIONS);
  cmd.action(async (opts: ListOpts, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const query: Record<string, unknown> = {};
      if (opts.search) query['search'] = opts.search;
      if (opts.ids) query['ids'] = opts.ids;
      if (opts.status) query['status'] = opts.status;
      if (opts.products) query['products'] = opts.products;
      if (opts.regionalOffices) query['regionalOffices'] = opts.regionalOffices;
      if (opts.sortBy) query['sortBy'] = opts.sortBy;
      if (opts.sortOrder) query['sortOrder'] = opts.sortOrder;

      const reqOptions = {
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      if (opts.all) {
        const limit = 100;
        let offset = 0;
        while (true) {
          const data = await client.customers.list({ ...query, limit, offset }, reqOptions);
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
      const data = await client.customers.list({ ...query, limit, offset }, reqOptions);
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
