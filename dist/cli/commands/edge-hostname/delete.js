"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEdgeHostnameDeleteCommand = registerEdgeHostnameDeleteCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerEdgeHostnameDeleteCommand(parent) {
    parent
        .command('delete <name>')
        .description('Delete an edge hostname')
        .option('--skip-usage-check', 'Send Check-Usage: no — skip dependency safety check')
        .action(async (name, opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const headers = {};
            if (opts.skipUsageCheck)
                headers['Check-Usage'] = 'no';
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                ...(Object.keys(headers).length > 0 ? { headers } : {}),
            };
            const data = await client.edgeHostnames.delete(name, reqOptions);
            (0, output_1.print)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=delete.js.map