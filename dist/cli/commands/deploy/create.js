"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPLOY_CREATE_OPTIONS = void 0;
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
const option_map_1 = require("../../option-map");
exports.DEPLOY_CREATE_OPTIONS = [
    { flag: '--target <env>', target: 'body', param: 'target', description: 'Deployment environment: staging | production', required: true },
    // Action flags
    { flag: '--deploy-property <id@version>', target: 'body', param: 'actions', description: 'Deploy a property at the specified version; repeatable', repeatable: true },
    { flag: '--remove-property <id>', target: 'body', param: 'actions', description: 'Remove a property from the target environment; repeatable', repeatable: true },
    { flag: '--deploy-cert <id@version>', target: 'body', param: 'actions', description: 'Deploy a certificate at the specified version; repeatable', repeatable: true },
    { flag: '--remove-cert <id>', target: 'body', param: 'actions', description: 'Remove a certificate from the target environment; repeatable', repeatable: true },
    // Metadata
    { flag: '--name <name>', target: 'body', param: 'name', description: 'Friendly name for the deployment task' },
    { flag: '--webhook <id>', target: 'body', param: 'webhookId', description: 'Webhook ID to call on task completion' },
    // Bypass headers
    { flag: '--skip-certificate-check', target: 'header', param: 'Check-Certificate', description: 'Send Check-Certificate: no', boolean: true },
    { flag: '--skip-client-ca-certificate-check', target: 'header', param: 'Check-Client-CA-Certificate', description: 'Send Check-Client-CA-Certificate: no', boolean: true },
    { flag: '--skip-origin-auth-certificate-check', target: 'header', param: 'Check-Origin-Auth-Certificate', description: 'Send Check-Origin-Auth-Certificate: no', boolean: true },
    { flag: '--skip-usage-check', target: 'header', param: 'Check-Usage', description: 'Skip active-hostname safety check', boolean: true },
    // Full-body + polling
    ...option_map_1.FILE_EXAMPLE,
    { flag: '--wait', target: 'cli-only', param: null, description: 'Poll until task completes', boolean: true },
    { flag: '--timeout <seconds>', target: 'cli-only', param: null, description: 'Max wait time [default: 600]' },
    { flag: '--poll-interval <seconds>', target: 'cli-only', param: null, description: 'Poll frequency [default: 30]' },
];
function parseAtVersion(spec, flagName) {
    const atIdx = spec.lastIndexOf('@');
    if (atIdx < 1 || atIdx === spec.length - 1) {
        throw new errors_2.CliError('VALIDATION', `${flagName} value "${spec}" must include a version suffix: <id>@<version>`);
    }
    return { id: spec.slice(0, atIdx), version: spec.slice(atIdx + 1) };
}
function registerDeployCreateCommand(parent) {
    const cmd = parent
        .command('create')
        .description('Create a deployment task');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.DEPLOY_CREATE_OPTIONS);
    (0, option_map_1.registerMappings)('deploy', 'create', exports.DEPLOY_CREATE_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, loader_1.getNamedSpecExample)('/cdn/deploymentTasks', 'post', 'Deploy a property and a certificate to production');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            const globals = cmdObj.optsWithGlobals();
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
            const id = data['id'];
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
                await (0, wait_1.waitForTask)((id) => client.deploymentTasks.get(id, { verbose: globals.verbose ?? 0 }), String(taskId), { timeout, pollInterval, outputFormat: fmt });
                (0, output_1.printCreateSuccess)('Deployment', 'deploymentId', String(taskId), fmt);
                return;
            }
            (0, output_1.printCreateSuccess)('Deployment', 'deploymentId', id, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map