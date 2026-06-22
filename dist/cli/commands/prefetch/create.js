"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREFETCH_CREATE_OPTIONS = void 0;
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
const option_map_1 = require("../../option-map");
exports.PREFETCH_CREATE_OPTIONS = [
    ...option_map_1.FILE_EXAMPLE,
    { flag: '--wait', target: 'cli-only', param: null, description: 'Poll until prefetch completes', boolean: true },
    { flag: '--timeout <seconds>', target: 'cli-only', param: null, description: 'Max wait time [default: 600]' },
    { flag: '--poll-interval <seconds>', target: 'cli-only', param: null, description: 'Poll frequency [default: 30]' },
];
function registerPrefetchCreateCommand(parent) {
    const cmd = parent
        .command('create')
        .description('Create a prefetch request');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.PREFETCH_CREATE_OPTIONS);
    (0, option_map_1.registerMappings)('prefetch', 'create', exports.PREFETCH_CREATE_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/prefetches', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, "--file <path>");
            const globals = cmdObj.optsWithGlobals();
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