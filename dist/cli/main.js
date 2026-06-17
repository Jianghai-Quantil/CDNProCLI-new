#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const auth_1 = require("./commands/auth");
const index_1 = require("./commands/property/index");
const index_2 = require("./commands/property-version/index");
const index_3 = require("./commands/cert/index");
const index_4 = require("./commands/cert-version/index");
const index_5 = require("./commands/deploy/index");
const index_6 = require("./commands/validation/index");
const index_7 = require("./commands/edge-hostname/index");
const index_8 = require("./commands/purge/index");
const index_9 = require("./commands/prefetch/index");
const index_10 = require("./commands/report/index");
const index_11 = require("./commands/log-config/index");
const index_12 = require("./commands/log-aggregation-point/index");
const index_13 = require("./commands/annotation/index");
const index_14 = require("./commands/hostname/index");
const index_15 = require("./commands/hostname-history/index");
const index_16 = require("./commands/webhook/index");
const index_17 = require("./commands/secret/index");
const index_18 = require("./commands/service-quota/index");
const index_19 = require("./commands/api-permission/index");
const index_20 = require("./commands/shield/index");
const index_21 = require("./commands/isp/index");
const index_22 = require("./commands/client-region/index");
const index_23 = require("./commands/staging-server/index");
const index_24 = require("./commands/public-ip/index");
const index_25 = require("./commands/origin-fast-route-ip/index");
const index_26 = require("./commands/ip-details/index");
const index_27 = require("./commands/system-config/index");
const index_28 = require("./commands/admin/index");
const schema_1 = require("./commands/schema");
const completion_1 = require("./commands/completion");
const update_1 = require("./commands/update");
const updater_1 = require("./updater");
const program = new commander_1.Command();
program
    .name('cdnpro')
    .description('CDN Pro CLI — manage CDN properties, certificates, deployments, and more')
    .version(updater_1.CURRENT_VERSION)
    // Global options inherited by all subcommands
    .option('-p, --profile <name>', 'Credential profile to use')
    .option('--host <host>', 'Override API host')
    .option('--user <user>', 'Override API username')
    .option('--secret-key <key>', 'Override API secret key')
    .option('-o, --output <format>', 'Output format: table | json | jsonl')
    .option('--no-color', 'Disable colored output')
    .option('-v, --verbose', 'Increase verbosity (-vv for more)', (_, prev) => prev + 1, 0)
    .option('--on-behalf-of <id>', 'On-Behalf-Of customer ID (resellers only)')
    .hook('preAction', (_thisCmd, actionCmd) => {
    // Disable chalk colors if --no-color is set
    if (actionCmd.optsWithGlobals().noColor) {
        chalk_1.default.level = 0;
    }
})
    .hook('postAction', () => {
    // Print a one-line update notice to stderr after the command completes
    // (only in interactive sessions; no-op when stdout is piped).
    (0, updater_1.printUpdateNotice)();
});
// Kick off a background version check (fires-and-forgets, non-blocking).
(0, updater_1.scheduleUpdateCheck)();
// Register command groups
(0, auth_1.registerAuthCommands)(program);
(0, index_1.registerPropertyCommands)(program);
(0, index_2.registerPropertyVersionCommands)(program);
(0, index_3.registerCertCommands)(program);
(0, index_4.registerCertVersionCommands)(program);
(0, index_5.registerDeployCommands)(program);
(0, index_6.registerValidationCommands)(program);
(0, index_7.registerEdgeHostnameCommands)(program);
(0, index_8.registerPurgeCommands)(program);
(0, index_9.registerPrefetchCommands)(program);
(0, index_10.registerReportCommands)(program);
(0, index_11.registerLogConfigCommands)(program);
(0, index_12.registerLogAggregationPointCommands)(program);
(0, index_13.registerAnnotationCommands)(program);
// Phase 4.8 — remaining commands
(0, index_14.registerHostnameCommands)(program);
(0, index_15.registerHostnameHistoryCommands)(program);
(0, index_16.registerWebhookCommands)(program);
(0, index_17.registerSecretCommands)(program);
(0, index_18.registerServiceQuotaCommands)(program);
(0, index_19.registerApiPermissionCommands)(program);
(0, index_20.registerShieldCommands)(program);
(0, index_21.registerIspCommands)(program);
(0, index_22.registerClientRegionCommands)(program);
(0, index_23.registerStagingServerCommands)(program);
(0, index_24.registerPublicIpCommands)(program);
(0, index_25.registerOriginFastRouteIpCommands)(program);
(0, index_26.registerIpDetailsCommands)(program);
(0, index_27.registerSystemConfigCommands)(program);
// Phase 4.9 — admin commands
(0, index_28.registerAdminCommands)(program);
// Phase 5.3 — schema introspection command
(0, schema_1.registerSchemaCommand)(program);
// Phase 7 — shell completion
(0, completion_1.registerCompletionCommand)(program);
// Update command
(0, update_1.registerUpdateCommand)(program);
// Unknown commands
program.on('command:*', (operands) => {
    console.error(`Unknown command: ${operands.join(' ')}\n`);
    console.error('Run `cdnpro --help` to see available commands.');
    process.exit(1);
});
program.parseAsync(process.argv).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
//# sourceMappingURL=main.js.map