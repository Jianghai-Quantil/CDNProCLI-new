"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPurgeCreateCommand = registerPurgeCreateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const util_1 = require("../../util");
const wait_1 = require("../../wait");
const loader_1 = require("../../../schema/loader");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
const util_2 = require("../../util");
function registerPurgeCreateCommand(parent) {
    parent
        .command('create')
        .description('Create a purge request')
        .requiredOption('--target <env>', 'Environment to purge: staging | production')
        .option('--url <url>', 'Exact file URL to purge; repeatable', (v, prev) => [...prev, v], [])
        .option('--dir <url>', 'Directory URL (supports * / **); repeatable; max 20', (v, prev) => [...prev, v], [])
        .option('--regex <pattern>', 'Regex pattern (scheme://hostname/...); repeatable; max 2', (v, prev) => [...prev, v], [])
        .option('--header <name:value>', 'Request header for cache-key disambiguation; repeatable', (v, prev) => [...prev, v], [])
        .option('--action <action>', 'Purge action: delete | invalidate [default: invalidate]')
        .option('--name <description>', 'Friendly name for the purge request')
        .option('--webhook <id>', 'Webhook ID to call on completion')
        .option('--file <path>', 'Full request body as JSON (- for stdin)')
        .option('--wait', 'Poll until purge completes')
        .option('--timeout <seconds>', 'Max wait time [default: 600]')
        .option('--poll-interval <seconds>', 'Poll frequency [default: 30]')
        .option('--example', 'Print an example request body and exit')
        .action(async (opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, loader_1.getNamedSpecExample)('/cdn/purges', 'post', 'Purge by URL') ??
                    (0, synthesize_1.getExampleBody)('/cdn/purges', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            let body;
            if (opts.file) {
                body = (0, util_1.readBodyFile)(opts.file);
                const validation = (0, validate_1.validateBody)('/cdn/purges', 'post', body);
                if (!validation.valid)
                    (0, util_2.emitValidationError)(validation, 'cdnpro purge create --example', globals.output);
            }
            else {
                const urls = opts.url ?? [];
                const dirs = opts.dir ?? [];
                const regexes = opts.regex ?? [];
                if (urls.length === 0 && dirs.length === 0 && regexes.length === 0) {
                    throw new errors_2.CliError('VALIDATION', 'At least one of --url, --dir, or --regex is required (or use --file)');
                }
                if (dirs.length > 20) {
                    throw new errors_2.CliError('VALIDATION', `--dir accepts at most 20 entries, got ${dirs.length}`);
                }
                if (regexes.length > 2) {
                    throw new errors_2.CliError('VALIDATION', `--regex accepts at most 2 entries, got ${regexes.length}`);
                }
                const purgeBody = {
                    target: opts.target,
                };
                if (urls.length > 0) {
                    const urlsEntry = { urls };
                    if ((opts.header ?? []).length > 0) {
                        const headers = {};
                        for (const h of opts.header ?? []) {
                            const colonIdx = h.indexOf(':');
                            if (colonIdx < 1) {
                                throw new errors_2.CliError('VALIDATION', `--header "${h}" must be in name:value format`);
                            }
                            headers[h.slice(0, colonIdx).trim()] = h.slice(colonIdx + 1).trim();
                        }
                        urlsEntry['headers'] = headers;
                    }
                    purgeBody['urls'] = urlsEntry;
                }
                if (dirs.length > 0)
                    purgeBody['dirs'] = { dirs };
                if (regexes.length > 0)
                    purgeBody['regex'] = { regexes };
                if (opts.action)
                    purgeBody['action'] = opts.action;
                if (opts.name)
                    purgeBody['name'] = opts.name;
                if (opts.webhook)
                    purgeBody['webhookId'] = opts.webhook;
                body = purgeBody;
            }
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.purges.create(body, reqOptions);
            if (opts.wait) {
                const taskId = (data['id'] ?? data['taskId']);
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
                const finalTask = await (0, wait_1.waitForTask)((id) => client.purges.get(id, { verbose: globals.verbose ?? 0 }), String(taskId), { timeout, pollInterval, outputFormat: fmt });
                const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
                if (effectiveFmt === 'table') {
                    (0, output_1.printTable)(finalTask);
                }
                else {
                    (0, output_1.printJson)(finalTask);
                }
                return;
            }
            const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
            if (effectiveFmt === 'table') {
                (0, output_1.printTable)(data);
            }
            else {
                (0, output_1.printJson)(data);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map