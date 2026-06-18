"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiAccountDeleteCommand = registerAdminApiAccountDeleteCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
function registerAdminApiAccountDeleteCommand(parent) {
    parent
        .command('delete <id>')
        .description('Delete an API account')
        .action(async (id, opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.apiAccounts.delete(id, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=delete.js.map