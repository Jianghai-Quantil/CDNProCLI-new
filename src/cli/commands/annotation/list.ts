import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError, CliError } from '../../errors';
import {
  OptionMapping,
  PAGINATION_OPTIONS,
  ALL,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

export const ANNOTATION_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--from <date>',  target: 'body', param: 'startDate', description: 'Start date (RFC 3339 UTC)' },
  { flag: '--to <date>',    target: 'body', param: 'endDate',   description: 'End date (RFC 3339 UTC)' },
  { flag: '--type <type>',  target: 'body', param: 'type',      description: 'Filter by type: client | configuration | operation' },
  { flag: '--search <term>', target: 'body', param: 'search',   description: 'Filter by ID or comment text' },
  ...PAGINATION_OPTIONS,
  ALL,
];

export function registerAnnotationListCommand(parent: Command): void {
  const cmd = parent
    .command('list')
    .description('List annotations');

  registerOptionsFromMapping(cmd, ANNOTATION_LIST_OPTIONS);
  registerMappings('annotation', 'list', ANNOTATION_LIST_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query, body, reqOptions } = buildRequestFromMapping(opts, ANNOTATION_LIST_OPTIONS);

      if (opts.all) {
        const limit = 100;
        let offset = 0;
        while (true) {
          const data = await client.annotations.list(
            { ...(body ?? {}), ...query, limit, offset },
            reqOptions,
          );
          const { items } = buildMeta(data);
          if (items.length === 0) break;
          printJsonl(items);
          if (items.length < limit) break;
          offset += limit;
        }
        return;
      }

      const limit = parseInt(String(opts.limit ?? '10'), 10);
      if (isNaN(limit) || limit < 1) {
        throw new CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
      }
      const offset = parseInt(String(opts.offset ?? '0'), 10);
      if (isNaN(offset) || offset < 0) {
        throw new CliError('VALIDATION', `--offset must be a non-negative integer, got: ${opts.offset}`);
      }
      const data = await client.annotations.list(
        { ...(body ?? {}), ...query, limit, offset },
        reqOptions,
      );
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
