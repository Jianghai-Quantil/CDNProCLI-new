"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrefetchCreateCommand = registerPrefetchCreateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const util_1 = require("../../util");
const wait_1 = require("../../wait");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
function registerPrefetchCreateCommand(parent) {
    parent
        .command('create')
        .description('Create a prefetch request')
        .option('--file <path>', 'Request body as JSON (- for stdin)')
        .option('--example', 'Print an example request body and exit')
        .option('--wait', 'Poll until prefetch completes')
        .option('--timeout <seconds>', 'Max wait time [default: 600]')
        .option('--poll-interval <seconds>', 'Poll frequency [default: 30]')
        .action(async (opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/prefetches', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            if (!opts.file) {
                process.stderr.write("Error: required option '--file <path>' not specified\n");
                process.exit(1);
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/prefetches', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro prefetch create --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const raw = await client.prefetches.create(body, { ...reqOptions, raw: true });
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
                await (0, wait_1.waitForTask)((id) => client.prefetches.get(id, { verbose: globals.verbose ?? 0 }), String(taskId), { timeout, pollInterval, outputFormat: fmt });
                (0, output_1.printCreateSuccess)('Prefetch', 'prefetchId', String(taskId), fmt);
                return;
            }
            (0, output_1.printCreateSuccess)('Prefetch', 'prefetchId', id, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map