"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_CONFIG_CREATE_OPTIONS = void 0;
exports.registerLogConfigCreateCommand = registerLogConfigCreateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
const option_map_1 = require("../../option-map");
exports.LOG_CONFIG_CREATE_OPTIONS = [
    ...option_map_1.FILE_EXAMPLE,
];
function registerLogConfigCreateCommand(parent) {
    const cmd = parent
        .command('create')
        .description('Create a log delivery configuration');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.LOG_CONFIG_CREATE_OPTIONS);
    (0, option_map_1.registerMappings)('log-config', 'create', exports.LOG_CONFIG_CREATE_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/report/logConfigs', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, "--file <path>");
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/report/logConfigs', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro log-config create --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const raw = await client.logConfigs.create(body, { ...reqOptions, raw: true });
            const data = (0, util_1.enrichWithLocationId)(raw);
            const id = data['id'];
            (0, output_1.printCreateSuccess)('Log Config', 'logConfigId', id, globals.output);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map