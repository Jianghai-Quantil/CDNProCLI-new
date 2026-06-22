"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogAggregationPointListCommand = registerLogAggregationPointListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
function registerLogAggregationPointListCommand(parent) {
    const LOG_AGGREGATION_POINT_LIST_OPTIONS = [
        { flag: '--search <term>', target: 'query', param: 'search', description: 'Keyword search' },
    ];
    (0, option_map_1.registerMappings)('log-aggregation-point', 'list', LOG_AGGREGATION_POINT_LIST_OPTIONS);
    const cmd = parent
        .command('list')
        .description('List log aggregation points');
    (0, option_map_1.registerOptionsFromMapping)(cmd, LOG_AGGREGATION_POINT_LIST_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.search)
                query['search'] = opts.search;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.logAggregationPoints.list(query, reqOptions);
            const { items, meta } = (0, output_1.buildMeta)(data);
            const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
            if (effectiveFmt === 'table') {
                (0, output_1.printTable)(items);
            }
            else if (effectiveFmt === 'jsonl') {
                (0, output_1.printJsonl)(items);
            }
            else {
                (0, output_1.printJson)(items, meta);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=list.js.map