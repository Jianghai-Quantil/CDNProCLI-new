"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShieldListCommand = registerShieldListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerShieldListCommand(parent) {
    parent
        .command('list')
        .description('List origin shields')
        .option('--search <term>', 'Keyword search')
        .option('--used-in-properties', 'Filter to shields referenced by at least one property')
        .option('--sort-by <field>', 'Sort field: lastUpdated | effectiveDate')
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
            if (opts.usedInProperties)
                query['usedInProperties'] = true;
            if (opts.sortBy)
                query['sortBy'] = opts.sortBy;
            if (opts.sortOrder)
                query['sortOrder'] = opts.sortOrder;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.shields.list(query, reqOptions);
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