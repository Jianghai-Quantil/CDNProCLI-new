"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHostnameHistoryGetCommand = registerHostnameHistoryGetCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerHostnameHistoryGetCommand(parent) {
    parent
        .command('get <hostname>')
        .description('Get deployment history for a specific hostname')
        .option('--from <date>', 'Start date (RFC 3339 UTC)')
        .option('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--target <target>', 'Filter by deployment target: staging | production | all')
        .action(async (hostname, opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.from)
                query['from'] = opts.from;
            if (opts.to)
                query['to'] = opts.to;
            if (opts.target)
                query['target'] = opts.target;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.hostnameHistory.get(hostname, query, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map