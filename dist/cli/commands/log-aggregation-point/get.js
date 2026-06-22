"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogAggregationPointGetCommand = registerLogAggregationPointGetCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
function registerLogAggregationPointGetCommand(parent) {
    (0, option_map_1.registerMappings)('log-aggregation-point', 'get', []);
    parent
        .command('get <id>')
        .description('Get a log aggregation point by ID')
        .action(async (id, opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.logAggregationPoints.get(id, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map