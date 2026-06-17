"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPurgeSummaryCommand = registerPurgeSummaryCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerPurgeSummaryCommand(parent) {
    parent
        .command('summary')
        .description('Get purge usage summary')
        .option('--from <date>', 'Start date (RFC 3339 UTC)')
        .option('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--target <env>', 'Filter by environment: staging | production')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.from)
                query['startDate'] = opts.from;
            if (opts.to)
                query['endDate'] = opts.to;
            if (opts.target)
                query['target'] = opts.target;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.purges.summary(query, reqOptions);
            (0, output_1.print)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=summary.js.map