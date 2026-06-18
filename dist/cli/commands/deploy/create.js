"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeployCreateCommand = registerDeployCreateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const util_1 = require("../../util");
const wait_1 = require("../../wait");
const loader_1 = require("../../../schema/loader");
const validate_1 = require("../../../schema/validate");
function parseAtVersion(spec, flagName) {
    const atIdx = spec.lastIndexOf('@');
    if (atIdx < 1 || atIdx === spec.length - 1) {
        throw new errors_2.CliError('VALIDATION', `${flagName} value "${spec}" must include a version suffix: <id>@<version>`);
    }
    return { id: spec.slice(0, atIdx), version: spec.slice(atIdx + 1) };
}
function registerDeployCreateCommand(parent) {
    parent
        .command('create')
        .description('Create a deployment task')
        .option('--target <env>', 'Deployment environment: staging | production')
        // Action flags
        .option('--deploy-property <id@version>', 'Deploy a property at the specified version; repeatable', (v, prev) => [...prev, v], [])
        .option('--remove-property <id>', 'Remove a property from the target environment; repeatable', (v, prev) => [...prev, v], [])
        .option('--deploy-cert <id@version>', 'Deploy a certificate at the specified version; repeatable', (v, prev) => [...prev, v], [])
        .option('--remove-cert <id>', 'Remove a certificate from the target environment; repeatable', (v, prev) => [...prev, v], [])
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
        .action(async (opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, loader_1.getNamedSpecExample)('/cdn/deploymentTasks', 'post', 'Deploy a property and a certificate to production');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            let body;
            (0, util_1.checkRequiredOption)(opts.target, '--target <env>');
            if (opts.file) {
                body = (0, util_1.readBodyFile)(opts.file);
                const validation = (0, validate_1.validateBody)('/cdn/deploymentTasks', 'post', body);
                if (!validation.valid)
                    (0, util_1.emitValidationError)(validation, 'cdnpro deploy create --example', globals.output);
            }
            else {
                const hasActions = (opts.deployProperty?.length ?? 0) > 0 ||
                    (opts.removeProperty?.length ?? 0) > 0 ||
                    (opts.deployCert?.length ?? 0) > 0 ||
                    (opts.removeCert?.length ?? 0) > 0;
                if (!hasActions) {
                    throw new errors_2.CliError('VALIDATION', 'At least one action flag is required: --deploy-property, --remove-property, --deploy-cert, --remove-cert');
                }
                const actions = [];
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
                const taskBody = {
                    target: opts.target,
                    actions,
                };
                if (opts.name)
                    taskBody['name'] = opts.name;
                if (opts.webhook)
                    taskBody['webhookId'] = opts.webhook;
                body = taskBody;
            }
            const bypassHeaders = {};
            if (opts.skipCertificateCheck)
                bypassHeaders['Check-Certificate'] = 'no';
            if (opts.skipClientCaCertificateCheck)
                bypassHeaders['Check-Client-CA-Certificate'] = 'no';
            if (opts.skipOriginAuthCertificateCheck)
                bypassHeaders['Check-Origin-Auth-Certificate'] = 'no';
            if (opts.skipUsageCheck)
                bypassHeaders['Check-Usage'] = 'no';
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                ...(Object.keys(bypassHeaders).length > 0 ? { headers: bypassHeaders } : {}),
            };
            const raw = await client.deploymentTasks.create(body, { ...reqOptions, raw: true });
            const data = (0, util_1.enrichWithLocationId)(raw);
            if (opts.wait) {
                const taskId = data['id'];
                if (!taskId)
                    throw new errors_2.CliError('ERROR', 'Server did not return a task ID; cannot poll');
                const timeout = parseInt(opts.timeout ?? '600', 10);
                if (isNaN(timeout) || timeout < 1) {
                    throw new errors_2.CliError('VALIDATION', `--timeout must be a positive integer, got: ${opts.timeout}`);
                }
                const pollInterval = parseInt(opts.pollInterval ?? '30', 10);
                if (isNaN(pollInterval) || pollInterval < 1) {
                    throw new errors_2.CliError('VALIDATION', `--poll-interval must be a positive integer, got: ${opts.pollInterval}`);
                }
                const finalTask = await (0, wait_1.waitForTask)((id) => client.deploymentTasks.get(id, { verbose: globals.verbose ?? 0 }), String(taskId), { timeout, pollInterval, outputFormat: fmt });
                (0, output_1.printResult)(finalTask, fmt);
                return;
            }
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map