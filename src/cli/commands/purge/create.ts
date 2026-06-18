import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { waitForTask } from '../../wait';
import { getNamedSpecExample } from '../../../schema/loader';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

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
  parent
    .command('create')
    .description('Create a purge request')
    .option('--target <env>', 'Environment to purge: staging | production')
    .option('--url <url>', 'Exact file URL to purge; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--dir <url>', 'Directory URL (supports * / **); repeatable; max 20', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--regex <pattern>', 'Regex pattern (scheme://hostname/...); repeatable; max 2', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--header <name:value>', 'Request header for cache-key disambiguation; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--action <action>', 'Purge action: delete | invalidate [default: invalidate]')
    .option('--name <description>', 'Friendly name for the purge request')
    .option('--webhook <id>', 'Webhook ID to call on completion')
    .option('--file <path>', 'Full request body as JSON (- for stdin)')
    .option('--wait', 'Poll until purge completes')
    .option('--timeout <seconds>', 'Max wait time [default: 600]')
    .option('--poll-interval <seconds>', 'Poll frequency [default: 30]')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example =
            getNamedSpecExample('/cdn/purges', 'post', 'Purge by URL') ??
            getExampleBody('/cdn/purges', 'post');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
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

          const finalTask = await waitForTask(
            (id) => client.purges.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
            String(taskId),
            { timeout, pollInterval, outputFormat: fmt },
          );

          const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
          if (effectiveFmt === 'table') {
            printTable(finalTask);
          } else {
            printJson(finalTask);
          }
          return;
        }

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(data);
        } else {
          printJson(data);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
