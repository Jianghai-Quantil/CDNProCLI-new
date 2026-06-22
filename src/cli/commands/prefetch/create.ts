import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId } from "../../util";
import { waitForTask } from '../../wait';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const PREFETCH_CREATE_OPTIONS: OptionMapping[] = [
  { flag: '--name <name>', target: 'body', param: 'name', description: 'Friendly name for the prefetch request' },
  { flag: '--url <url>', target: 'body', param: 'fileList.url', description: 'URL to prefetch (must begin with http/https); repeatable', repeatable: true },
  { flag: '--region <region>', target: 'body', param: 'regions', description: 'Region to prefetch from; repeatable', repeatable: true },
  { flag: '--start-time <datetime>', target: 'body', param: 'startTime', description: 'RFC 3339 UTC datetime when prefetch should begin' },
  { flag: '--webhook <id>', target: 'body', param: 'webhook', description: 'Webhook ID to call on completion' },
  ...FILE_EXAMPLE,
  { flag: '--wait', target: 'cli-only', param: null, description: 'Poll until prefetch completes', boolean: true },
  { flag: '--timeout <seconds>', target: 'cli-only', param: null, description: 'Max wait time [default: 600]' },
  { flag: '--poll-interval <seconds>', target: 'cli-only', param: null, description: 'Poll frequency [default: 30]' },
];

interface CreateOpts {
  name?: string;
  url?: string[];
  region?: string[];
  startTime?: string;
  webhook?: string;
  file?: string;
  wait?: boolean;
  timeout?: string;
  pollInterval?: string;
  example?: boolean;
}

export function registerPrefetchCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create')
    .description('Create a prefetch request');

  registerOptionsFromMapping(cmd, PREFETCH_CREATE_OPTIONS);
  registerMappings('prefetch', 'create', PREFETCH_CREATE_OPTIONS);

  cmd.action(async (opts: CreateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/prefetches', 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      let body: unknown;

      if (opts.file) {
        body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/prefetches', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro prefetch create --example', globals.output);
      } else {
        const urls = opts.url ?? [];
        if (urls.length === 0) {
          throw new CliError(
            'VALIDATION',
            'At least one --url is required (or use --file)',
          );
        }

        const prefetchBody: Record<string, unknown> = {
          fileList: urls.map(u => ({ url: u })),
        };

        if (opts.name) prefetchBody['name'] = opts.name;
        if (opts.region) prefetchBody['regions'] = opts.region;
        if (opts.startTime) prefetchBody['startTime'] = opts.startTime;
        if (opts.webhook) prefetchBody['webhook'] = opts.webhook;

        body = prefetchBody;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.prefetches.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
      const data = enrichWithLocationId(raw);
      const id = data['id'] as string;

      if (opts.wait) {
        const taskId = data['id'] as string | undefined;
        if (!taskId) throw new CliError('ERROR', 'Server did not return a task ID; cannot poll');

        const timeout = parseInt(opts.timeout ?? '600', 10);
        if (isNaN(timeout) || timeout < 1) {
          throw new CliError('VALIDATION', `--timeout must be a positive integer, got: ${opts.timeout}`);
        }
        const pollInterval = parseInt(opts.pollInterval ?? '30', 10);
        if (isNaN(pollInterval) || pollInterval < 1) {
          throw new CliError('VALIDATION', `--poll-interval must be a positive integer, got: ${opts.pollInterval}`);
        }

        printCreateSuccess('Prefetch', 'prefetchId', String(taskId), fmt);

        await waitForTask(
          (id) => client.prefetches.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
          String(taskId),
          { taskType: 'prefetch', timeout, pollInterval, outputFormat: fmt },
        );
        return;
      }

      printCreateSuccess('Prefetch', 'prefetchId', id, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
