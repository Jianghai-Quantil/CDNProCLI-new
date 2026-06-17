"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClientRegionCommands = registerClientRegionCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerClientRegionCommands(parent) {
    const cmd = parent
        .command('client-region')
        .description('List client regions (read-only reference data)');
    cmd
        .command('list')
        .description('List client regions')
        .option('--search <term>', 'Keyword search')
        .option('--isp-code <code>', 'Filter by ISP code')
        .option('--sort-order <order>', 'Sort order: asc | desc')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.search)
                query['search'] = opts.search;
            if (opts.ispCode)
                query['ispCode'] = opts.ispCode;
            if (opts.sortOrder)
                query['sortOrder'] = opts.sortOrder;
            const data = await client.geo.clientRegions(query);
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