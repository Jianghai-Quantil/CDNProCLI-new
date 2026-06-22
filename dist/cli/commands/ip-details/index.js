"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IP_DETAILS_LOOKUP_OPTIONS = void 0;
exports.registerIpDetailsCommands = registerIpDetailsCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
const option_map_1 = require("../../option-map");
exports.IP_DETAILS_LOOKUP_OPTIONS = [
    ...option_map_1.FILE_EXAMPLE,
];
function registerIpDetailsCommands(parent) {
    const ipCmd = parent
        .command('ip-details')
        .description('Look up details for IP addresses');
    const cmd = ipCmd
        .command('lookup')
        .description('Look up details for a list of IP addresses (POST /ngadmin/ipDetails)');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.IP_DETAILS_LOOKUP_OPTIONS);
    (0, option_map_1.registerMappings)('ip-details', 'lookup', exports.IP_DETAILS_LOOKUP_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/ngadmin/ipDetails', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, '--file <path>');
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/ngadmin/ipDetails', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro schema ip-details lookup', globals.output);
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.geo.ipDetails(body, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=index.js.map