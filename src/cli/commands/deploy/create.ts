import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { waitForTask } from '../../wait';
import { getNamedSpecExample } from '../../../schema/loader';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const DEPLOY_CREATE_OPTIONS: OptionMapping[] = [
  { flag: '--target <env>',             target: 'body',   param: 'target',          description: 'Deployment environment: staging | production', required: true },
  // Action flags
  { flag: '--deploy-property <id@version>', target: 'body', param: 'actions',      description: 'Deploy a property at the specified version; repeatable', repeatable: true },
  { flag: '--remove-property <id>',      target: 'body',   param: 'actions',        description: 'Remove a property from the target environment; repeatable', repeatable: true },
  { flag: '--deploy-cert <id@version>',  target: 'body',   param: 'actions',        description: 'Deploy a certificate at the specified version; repeatable', repeatable: true },
  { flag: '--remove-cert <id>',          target: 'body',   param: 'actions',        description: 'Remove a certificate from the target environment; repeatable', repeatable: true },
  // Metadata
  { flag: '--name <name>',               target: 'body',   param: 'name',            description: 'Friendly name for the deployment task' },
  { flag: '--webhook <id>',              target: 'body',   param: 'webhookId',       description: 'Webhook ID to call on task completion' },
  // Bypass headers
  { flag: '--skip-certificate-check',            target: 'header', param: 'Check-Certificate',            description: 'Send Check-Certificate: no', boolean: true },
  { flag: '--skip-client-ca-certificate-check',  target: 'header', param: 'Check-Client-CA-Certificate',  description: 'Send Check-Client-CA-Certificate: no', boolean: true },
  { flag: '--skip-origin-auth-certificate-check', target: 'header', param: 'Check-Origin-Auth-Certificate', description: 'Send Check-Origin-Auth-Certificate: no', boolean: true },
  { flag: '--skip-usage-check',                  target: 'header', param: 'Check-Usage',                  description: 'Skip active-hostname safety check', boolean: true },
  // Full-body + polling
  ...FILE_EXAMPLE,
  { flag: '--wait',                    target: 'cli-only', param: null, description: 'Poll until task completes', boolean: true },
  { flag: '--timeout <seconds>',       target: 'cli-only', param: null, description: 'Max wait time [default: 600]' },
  { flag: '--poll-interval <seconds>', target: 'cli-only', param: null, description: 'Poll frequency [default: 30]' },
];

interface CreateOpts {
  target?: string;
  deployProperty?: string[];
  removeProperty?: string[];
  deployCert?: string[];
  removeCert?: string[];
  name?: string;
  webhook?: string;
  file?: string;
  wait?: boolean;
  timeout?: string;
  pollInterval?: string;
  skipCertificateCheck?: boolean;
  skipClientCaCertificateCheck?: boolean;
  skipOriginAuthCertificateCheck?: boolean;
  skipUsageCheck?: boolean;
  example?: boolean;
}

function parseAtVersion(spec: string, flagName: string): { id: string; version: string } {
  const atIdx = spec.lastIndexOf('@');
  if (atIdx < 1 || atIdx === spec.length - 1) {
    throw new CliError(
      'VALIDATION',
      `${flagName} value "${spec}" must include a version suffix: <id>@<version>`,
    );
  }
  return { id: spec.slice(0, atIdx), version: spec.slice(atIdx + 1) };
}

export function registerDeployCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create')
    .description('Create a deployment task');

  registerOptionsFromMapping(cmd, DEPLOY_CREATE_OPTIONS);
  registerMappings('deploy', 'create', DEPLOY_CREATE_OPTIONS);

  cmd.action(async (opts: CreateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getNamedSpecExample(
          '/cdn/deploymentTasks',
          'post',
          'Deploy a property and a certificate to production',
        );
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
        const validation = validateBody('/cdn/deploymentTasks', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro deploy create --example', globals.output);
      } else {
        const hasActions =
          (opts.deployProperty?.length ?? 0) > 0 ||
          (opts.removeProperty?.length ?? 0) > 0 ||
          (opts.deployCert?.length ?? 0) > 0 ||
          (opts.removeCert?.length ?? 0) > 0;

        if (!hasActions) {
          throw new CliError(
            'VALIDATION',
            'At least one action flag is required: --deploy-property, --remove-property, --deploy-cert, --remove-cert',
          );
        }

        const actions: Record<string, unknown>[] = [];

        for (const spec of opts.deployProperty ?? []) {
          const { id, version } = parseAtVersion(spec, '--deploy-property');
          actions.push({ action: 'deploy_property', propertyId: id, version });
        }
        for (const id of opts.removeProperty ?? []) {
          actions.push({ action: 'remove_property', propertyId: id });
        }
        for (const spec of opts.deployCert ?? []) {
          const { id, version } = parseAtVersion(spec, '--deploy-cert');
          actions.push({ action: 'deploy_cert', certificateId: id, version });
        }
        for (const id of opts.removeCert ?? []) {
          actions.push({ action: 'remove_cert', certificateId: id });
        }

        const taskBody: Record<string, unknown> = {
          target: opts.target,
          actions,
        };
        if (opts.name) taskBody['name'] = opts.name;
        if (opts.webhook) taskBody['webhookId'] = opts.webhook;
        body = taskBody;
      }

      const bypassHeaders: Record<string, string> = {};
      if (opts.skipCertificateCheck) bypassHeaders['Check-Certificate'] = 'no';
      if (opts.skipClientCaCertificateCheck) bypassHeaders['Check-Client-CA-Certificate'] = 'no';
      if (opts.skipOriginAuthCertificateCheck) bypassHeaders['Check-Origin-Auth-Certificate'] = 'no';
      if (opts.skipUsageCheck) bypassHeaders['Check-Usage'] = 'no';

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(bypassHeaders).length > 0 ? { headers: bypassHeaders } : {}),
      };

      const raw = await client.deploymentTasks.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
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

        await waitForTask(
          (id) => client.deploymentTasks.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
          String(taskId),
          { timeout, pollInterval, outputFormat: fmt },
        );

        printCreateSuccess('Deployment', 'deploymentId', String(taskId), fmt);
        return;
      }

      printCreateSuccess('Deployment', 'deploymentId', id, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
