import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from "../../util";
import { waitForTask } from '../../wait';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const VALIDATION_CREATE_OPTIONS: OptionMapping[] = [
  { flag: '--property-id <id>', target: 'body', param: 'propertyId', description: 'Property ID to validate' },
  { flag: '--property-version <version>', target: 'body', param: 'version', description: 'Property version to validate' },
  { flag: '--name <name>', target: 'body', param: 'name', description: 'Friendly name for the validation task' },
  { flag: '--webhook <id>', target: 'body', param: 'webhookId', description: 'Webhook ID to call on task completion' },
  ...FILE_EXAMPLE,
  { flag: '--wait', target: 'cli-only', param: null, description: 'Poll until validation completes', boolean: true },
  { flag: '--timeout <seconds>', target: 'cli-only', param: null, description: 'Max wait time [default: 300]' },
  { flag: '--poll-interval <seconds>', target: 'cli-only', param: null, description: 'Poll frequency [default: 10]' },
];

interface CreateOpts {
  propertyId?: string;
  propertyVersion?: string;
  name?: string;
  webhook?: string;
  file?: string;
  wait?: boolean;
  timeout?: string;
  pollInterval?: string;
  example?: boolean;
}

export function registerValidationCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create')
    .description('Create a validation task from a JSON body file');

  registerOptionsFromMapping(cmd, VALIDATION_CREATE_OPTIONS);
  registerMappings('validation', 'create', VALIDATION_CREATE_OPTIONS);

  cmd.action(async (opts: CreateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/validations', 'post');
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
        const validation = validateBody('/cdn/validations', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro validation create --example', globals.output);
      } else {
        checkRequiredOption(opts.propertyId, '--property-id <id>');
        checkRequiredOption(opts.propertyVersion, '--property-version <version>');

        const taskBody: Record<string, unknown> = {
          propertyId: opts.propertyId,
          version: opts.propertyVersion,
        };
        if (opts.name) taskBody['name'] = opts.name;
        if (opts.webhook) taskBody['webhookId'] = opts.webhook;
        body = taskBody;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.validations.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
      const data = enrichWithLocationId(raw);
      const id = data['id'] as string;

      if (opts.wait) {
        const taskId = data['id'] as string | undefined;
        if (!taskId) throw new CliError('ERROR', 'Server did not return a task ID; cannot poll');

        const timeout = parseInt(opts.timeout ?? '300', 10);
        if (isNaN(timeout) || timeout < 1) {
          throw new CliError('VALIDATION', `--timeout must be a positive integer, got: ${opts.timeout}`);
        }
        const pollInterval = parseInt(opts.pollInterval ?? '10', 10);
        if (isNaN(pollInterval) || pollInterval < 1) {
          throw new CliError('VALIDATION', `--poll-interval must be a positive integer, got: ${opts.pollInterval}`);
        }

        printCreateSuccess('Validation', 'validationId', String(taskId), fmt);

        await waitForTask(
          (id) => client.validations.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
          String(taskId),
          { taskType: 'validation', timeout, pollInterval, outputFormat: fmt },
        );
        return;
      }

      printCreateSuccess('Validation', 'validationId', id, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
