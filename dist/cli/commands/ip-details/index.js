"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpDetailsCommands = registerIpDetailsCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const validate_1 = require("../../../schema/validate");
function registerIpDetailsCommands(parent) {
    const ipCmd = parent
        .command('ip-details')
        .description('Look up details for IP addresses');
    ipCmd
        .command('lookup')
        .description('Look up details for a list of IP addresses (POST /ngadmin/ipDetails)')
        .requiredOption('--file <path>', 'Request body as JSON (- for stdin)')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
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
            (0, output_1.print)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=index.js.map