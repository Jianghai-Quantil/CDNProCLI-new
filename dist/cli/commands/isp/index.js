"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIspCommands = registerIspCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
const ISP_LIST_OPTIONS = [
    { flag: '--search <term>', target: 'query', param: 'search', description: 'Keyword search' },
    { flag: '--region-code <code>', target: 'query', param: 'regionCode', description: 'Filter by region code' },
    { flag: '--sort-order <order>', target: 'query', param: 'sortOrder', description: 'Sort order: asc | desc' },
];
function registerIspCommands(parent) {
    const cmd = parent
        .command('isp')
        .description('List ISPs (read-only reference data)');
    const listCmd = cmd
        .command('list')
        .description('List ISPs');
    (0, option_map_1.registerOptionsFromMapping)(listCmd, ISP_LIST_OPTIONS);
    (0, option_map_1.registerMappings)('isp', 'list', ISP_LIST_OPTIONS);
    listCmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query } = (0, option_map_1.buildRequestFromMapping)(opts, ISP_LIST_OPTIONS);
            const data = await client.geo.isps(query);
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
//# sourceMappingURL=index.js.map