import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError, CliError } from '../../errors';
import {
  OptionMapping,
  SORT_OPTIONS,
  PAGINATION_OPTIONS,
  REPORT_RANGE,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

export const DEPLOY_LIST_OPTIONS: OptionMapping[] = [
  { flag: '--from <date>',       target: 'query', param: 'from',          description: 'Filter by submission time (start)' },
  { flag: '--to <date>',         target: 'query', param: 'to',            description: 'Filter by submission time (end)' },
  { flag: '--target <target>',   target: 'query', param: 'target',        description: 'Filter by environment: staging | production' },
  { flag: '--status <status>',   target: 'query', param: 'status',        description: 'Filter by status: waiting | inprogress | failed | succeeded' },
  { flag: '--property <id>',     target: 'query', param: 'propertyId',    description: 'Filter by property ID' },
  { flag: '--cert <id>',         target: 'query', param: 'certificateId', description: 'Filter by certificate ID' },
  { flag: '--search <term>',     target: 'query', param: 'search',        description: 'Keyword search' },
  { flag: '--task-ids <id,...>', target: 'query', param: 'taskIds',       description: 'Comma-separated task IDs' },
  ...SORT_OPTIONS,
  ...PAGINATION_OPTIONS,
  REPORT_RANGE,
  { flag: '--all', target: 'cli-only', param: null, description: 'Auto-paginate; implies --output jsonl' },
];

export function registerDeployListCommand(parent: Command): void {
  const cmd = parent
    .command('list')
    .description('List deployment tasks');

  registerOptionsFromMapping(cmd, DEPLOY_LIST_OPTIONS);
  registerMappings('deploy', 'list', DEPLOY_LIST_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query, reqOptions } = buildRequestFromMapping(opts, DEPLOY_LIST_OPTIONS);

      if (opts.all) {
        const limit = 100;
        let offset = 0;
        while (true) {
          const data = await client.deploymentTasks.list(
            { ...query, limit, offset } as Record<string, unknown>,
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
      const data = await client.deploymentTasks.list(
        { ...query, limit, offset } as Record<string, unknown>,
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
