import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { waitForTask } from '../../wait';
import { getNamedSpecExample } from '../../../schema/loader';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const PURGE_CREATE_OPTIONS: OptionMapping[] = [
  { flag: '--target <env>',            target: 'body',     param: 'target',          description: 'Environment to purge: staging | production', required: true },
  { flag: '--url <url>',               target: 'body',     param: 'urls.urls',        description: 'Exact file URL to purge; repeatable', repeatable: true },
  { flag: '--dir <url>',               target: 'body',     param: 'dirs.dirs',        description: 'Directory URL (supports * / **); repeatable; max 20', repeatable: true },
  { flag: '--regex <pattern>',         target: 'body',     param: 'regex.regexes',    description: 'Regex pattern (scheme://hostname/...); repeatable; max 2', repeatable: true },
  { flag: '--header <name:value>',     target: 'body',     param: 'urls.headers',     description: 'Request header for cache-key disambiguation; repeatable', repeatable: true },
  { flag: '--action <action>',         target: 'body',     param: 'action',           description: 'Purge action: delete | invalidate [default: invalidate]' },
  { flag: '--name <description>',      target: 'body',     param: 'name',             description: 'Friendly name for the purge request' },
  { flag: '--webhook <id>',            target: 'body',     param: 'webhookId',        description: 'Webhook ID to call on completion' },
  ...FILE_EXAMPLE,
  { flag: '--wait',                    target: 'cli-only', param: null,               description: 'Poll until purge completes', boolean: true },
  { flag: '--timeout <seconds>',       target: 'cli-only', param: null,               description: 'Max wait time [default: 600]' },
  { flag: '--poll-interval <seconds>', target: 'cli-only', param: null,               description: 'Poll frequency [default: 30]' },
];

interface CreateOpts {
  target?: string;
  url?: string[];
  dir?: string[];
  regex?: string[];
  header?: string[];
  action?: string;
  name?: string;
  webhook?: string;
  file?: string;
  wait?: boolean;
  timeout?: string;
  pollInterval?: string;
  example?: boolean;
}

export function registerPurgeCreateCommand(parent: Command): void {
  registerMappings('purge', 'create', PURGE_CREATE_OPTIONS);

  const cmd = parent.command('create')
    .description('Create a purge request');
  registerOptionsFromMapping(cmd, PURGE_CREATE_OPTIONS);
  cmd.action(async (opts: CreateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example =
          getNamedSpecExample('/cdn/purges', 'post', 'Purge by URL') ??
          getExampleBody('/cdn/purges', 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      let body: unknown;

      checkRequiredOption(opts.target, '--target <env>');

      if (opts.file) {
        body = readBodyFile(opts.file);
        const validation = validateBody('/cdn/purges', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro purge create --example', globals.output);
      } else {
        const urls = opts.url ?? [];
        const dirs = opts.dir ?? [];
        const regexes = opts.regex ?? [];

        if (urls.length === 0 && dirs.length === 0 && regexes.length === 0) {
          throw new CliError(
            'VALIDATION',
            'At least one of --url, --dir, or --regex is required (or use --file)',
          );
        }

        if (dirs.length > 20) {
          throw new CliError('VALIDATION', `--dir accepts at most 20 entries, got ${dirs.length}`);
        }
        if (regexes.length > 2) {
          throw new CliError('VALIDATION', `--regex accepts at most 2 entries, got ${regexes.length}`);
        }

        const purgeBody: Record<string, unknown> = {
          target: opts.target,
        };

        if (urls.length > 0) {
          const urlsEntry: Record<string, unknown> = { urls };
          if ((opts.header ?? []).length > 0) {
            const headers: Record<string, string> = {};
            for (const h of opts.header ?? []) {
              const colonIdx = h.indexOf(':');
              if (colonIdx < 1) {
                throw new CliError('VALIDATION', `--header "${h}" must be in name:value format`);
              }
              headers[h.slice(0, colonIdx).trim()] = h.slice(colonIdx + 1).trim();
            }
            urlsEntry['headers'] = headers;
          }
          purgeBody['urls'] = urlsEntry;
        }

        if (dirs.length > 0) purgeBody['dirs'] = { dirs };
        if (regexes.length > 0) purgeBody['regex'] = { regexes };
        if (opts.action) purgeBody['action'] = opts.action;
        if (opts.name) purgeBody['name'] = opts.name;
        if (opts.webhook) purgeBody['webhookId'] = opts.webhook;

        body = purgeBody;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.purges.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
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

        printCreateSuccess('Purge', 'purgeId', String(taskId), fmt);

        await waitForTask(
          (id) => client.purges.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
          String(taskId),
          { taskType: 'purge', timeout, pollInterval, outputFormat: fmt },
        );
        return;
      }

      printCreateSuccess('Purge', 'purgeId', id, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
