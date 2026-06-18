import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { waitForTask } from '../../wait';
import { getNamedSpecExample } from '../../../schema/loader';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
  target?: string;
  // Action flags (repeatable)
  deployProperty?: string[];
  removeProperty?: string[];
  deployCert?: string[];
  removeCert?: string[];
  // Metadata
  name?: string;
  webhook?: string;
  // Full-body fallback
  file?: string;
  // Polling
  wait?: boolean;
  timeout?: string;
  pollInterval?: string;
  // Bypass headers
  skipCertificateCheck?: boolean;
  skipClientCaCertificateCheck?: boolean;
  skipOriginAuthCertificateCheck?: boolean;
  skipUsageCheck?: boolean;
  // Example
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
  parent
    .command('create')
    .description('Create a deployment task')
    .option('--target <env>', 'Deployment environment: staging | production')
    // Action flags
    .option('--deploy-property <id@version>', 'Deploy a property at the specified version; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--remove-property <id>', 'Remove a property from the target environment; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--deploy-cert <id@version>', 'Deploy a certificate at the specified version; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--remove-cert <id>', 'Remove a certificate from the target environment; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    // Metadata
    .option('--name <name>', 'Friendly name for the deployment task')
    .option('--webhook <id>', 'Webhook ID to call on task completion')
    // Full-body fallback
    .option('--file <path>', 'Full request body as JSON (- for stdin)')
    // Polling
    .option('--wait', 'Poll until task completes')
    .option('--timeout <seconds>', 'Max wait time [default: 600]')
    .option('--poll-interval <seconds>', 'Poll frequency [default: 30]')
    // Bypass headers
    .option('--skip-certificate-check', 'Send Check-Certificate: no — skip TLS cert expiry/SAN check')
    .option('--skip-client-ca-certificate-check', 'Send Check-Client-CA-Certificate: no')
    .option('--skip-origin-auth-certificate-check', 'Send Check-Origin-Auth-Certificate: no')
    .option('--skip-usage-check', 'Send Check-Usage: no — skip active-hostname safety check')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
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

        const globals = cmd.optsWithGlobals<GlobalOptions>();
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
            (id) => client.deploymentTasks.get(id, { verbose: globals.verbose ?? 0 }) as Promise<unknown>,
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
