#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerAuthCommands } from './commands/auth';
import { registerPropertyCommands } from './commands/property/index';
import { registerPropertyVersionCommands } from './commands/property-version/index';
import { registerCertCommands } from './commands/cert/index';
import { registerCertVersionCommands } from './commands/cert-version/index';
import { registerDeployCommands } from './commands/deploy/index';
import { registerValidationCommands } from './commands/validation/index';
import { registerEdgeHostnameCommands } from './commands/edge-hostname/index';
import { registerPurgeCommands } from './commands/purge/index';
import { registerPrefetchCommands } from './commands/prefetch/index';
import { registerReportCommands } from './commands/report/index';
import { registerLogConfigCommands } from './commands/log-config/index';
import { registerLogAggregationPointCommands } from './commands/log-aggregation-point/index';
import { registerAnnotationCommands } from './commands/annotation/index';
import { registerHostnameCommands } from './commands/hostname/index';
import { registerHostnameHistoryCommands } from './commands/hostname-history/index';
import { registerWebhookCommands } from './commands/webhook/index';
import { registerSecretCommands } from './commands/secret/index';
import { registerServiceQuotaCommands } from './commands/service-quota/index';
import { registerApiPermissionCommands } from './commands/api-permission/index';
import { registerShieldCommands } from './commands/shield/index';
import { registerIspCommands } from './commands/isp/index';
import { registerClientRegionCommands } from './commands/client-region/index';
import { registerStagingServerCommands } from './commands/staging-server/index';
import { registerPublicIpCommands } from './commands/public-ip/index';
import { registerOriginFastRouteIpCommands } from './commands/origin-fast-route-ip/index';
import { registerIpDetailsCommands } from './commands/ip-details/index';
import { registerSystemConfigCommands } from './commands/system-config/index';
import { registerAdminCommands } from './commands/admin/index';
import { registerSchemaCommand } from './commands/schema';
import { registerCompletionCommand } from './commands/completion';
import { registerUpdateCommand } from './commands/update';
import { scheduleUpdateCheck, printUpdateNotice, CURRENT_VERSION } from './updater';

const program = new Command();

program
  .name('cdnpro')
  .description('CDN Pro CLI — manage CDN properties, certificates, deployments, and more')
  .version(CURRENT_VERSION)
  // Global options inherited by all subcommands
  .option('-p, --profile <name>', 'Credential profile to use')
  .option('--host <host>', 'Override API host')
  .option('--user <user>', 'Override API username')
  .option('--secret-key <key>', 'Override API secret key')
  .option('-o, --output <format>', 'Output format: table | json | jsonl')
  .option('--no-color', 'Disable colored output')
  .option('-v, --verbose', 'Increase verbosity (-vv for more)', (_, prev: number) => prev + 1, 0)
  .option('--on-behalf-of <id>', 'On-Behalf-Of customer ID (resellers only)')
  .hook('preAction', (_thisCmd, actionCmd) => {
    // Disable chalk colors if --no-color is set
    if (actionCmd.optsWithGlobals().noColor) {
      chalk.level = 0;
    }
    // Only real commands trigger the (cached, detached) update check —
    // not --version / --help, which exit before any action runs.
    scheduleUpdateCheck();
  })
  .hook('postAction', () => {
    // Print a one-line update notice to stderr after the command completes
    // (only in interactive sessions; no-op when stdout is piped).
    printUpdateNotice();
  });

// Register command groups
registerAuthCommands(program);
registerPropertyCommands(program);
registerPropertyVersionCommands(program);
registerCertCommands(program);
registerCertVersionCommands(program);
registerDeployCommands(program);
registerValidationCommands(program);
registerEdgeHostnameCommands(program);
registerPurgeCommands(program);
registerPrefetchCommands(program);
registerReportCommands(program);
registerLogConfigCommands(program);
registerLogAggregationPointCommands(program);
registerAnnotationCommands(program);
// Phase 4.8 — remaining commands
registerHostnameCommands(program);
registerHostnameHistoryCommands(program);
registerWebhookCommands(program);
registerSecretCommands(program);
registerServiceQuotaCommands(program);
registerApiPermissionCommands(program);
registerShieldCommands(program);
registerIspCommands(program);
registerClientRegionCommands(program);
registerStagingServerCommands(program);
registerPublicIpCommands(program);
registerOriginFastRouteIpCommands(program);
registerIpDetailsCommands(program);
registerSystemConfigCommands(program);
// Phase 4.9 — admin commands
registerAdminCommands(program);
// Phase 5.3 — schema introspection command
registerSchemaCommand(program);
// Phase 7 — shell completion
registerCompletionCommand(program);
// Update command
registerUpdateCommand(program);

// Unknown commands
program.on('command:*', (operands: string[]) => {
  console.error(`Unknown command: ${operands.join(' ')}\n`);
  console.error('Run `cdnpro --help` to see available commands.');
  process.exit(1);
});

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
