import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../../output';
import { handleError, CliError } from '../../../errors';
import {
  OptionMapping,
  REPORT_RANGE,
  ALL,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../../option-map';

export const APICALL_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--from <date>',          target: 'query', param: 'startdate',   description: 'Start date (RFC 3339 UTC or relative: 7d, 24H, 1M)' },
  { flag: '--to <date>',            target: 'query', param: 'enddate',     description: 'End date (RFC 3339 UTC or relative)' },
  { flag: '--method <method>',      target: 'query', param: 'method',      description: 'Filter by HTTP method: GET | POST | PATCH | PUT | DELETE' },
  { flag: '--path <uri>',           target: 'query', param: 'path',        description: 'Filter by API path' },
  { flag: '--safe <bool>',          target: 'query', param: 'safe',        description: 'Filter by safe flag: true | false' },
  { flag: '--caller <name-or-id>',  target: 'query', param: 'caller',      description: 'Filter by API account name or ID' },
  { flag: '--for-customer <id>',    target: 'query', param: 'forCustomer', description: 'Filter by on-behalf-of customer: customer ID | none | any' },
  { flag: '--status <code,...>',    target: 'query', param: 'status',      description: 'Filter by HTTP status codes or patterns (2xx, 4xx, etc.)' },
  { flag: '--before <apiRequestId>', target: 'query', param: 'before',     description: 'Cursor for pagination: return calls before this request ID' },
  { flag: '--limit <n>',            target: 'query', param: 'limit',       description: 'Page size [default: 100, max: 100]' },
  REPORT_RANGE,
  ALL,
];

export function registerAdminApiCallListCommand(parent: Command): void {
  const cmd = parent
    .command('list')
    .description('List API call log entries');

  registerOptionsFromMapping(cmd, APICALL_LIST_OPTIONS);
  registerMappings('apicall', 'list', APICALL_LIST_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query, reqOptions } = buildRequestFromMapping(opts, APICALL_LIST_OPTIONS);

      const limit = parseInt(String(opts.limit ?? '100'), 10);
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
