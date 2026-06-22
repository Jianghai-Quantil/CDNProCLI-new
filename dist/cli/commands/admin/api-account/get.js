"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiAccountGetCommand = registerAdminApiAccountGetCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
const option_map_1 = require("../../../option-map");
function registerAdminApiAccountGetCommand(parent) {
    (0, option_map_1.registerMappings)('api-account', 'get', []);
    parent
        .command('get <id>')
        .description('Get an API account by ID')
        .action(async (id, opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.apiAccounts.get(id, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map