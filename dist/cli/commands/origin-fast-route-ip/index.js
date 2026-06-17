"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOriginFastRouteIpCommands = registerOriginFastRouteIpCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerOriginFastRouteIpCommands(parent) {
    const cmd = parent
        .command('origin-fast-route-ip')
        .description('List origin fast-route IP ranges (read-only reference data)');
    cmd
        .command('list')
        .description('List origin fast-route IP ranges')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const data = await client.geo.originFastRouteIpList();
            const { items, meta } = (0, output_1.buildMeta)(data);
            const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
            if (effectiveFmt === 'table') {
                (0, output_1.printTable)(items, ['ip', 'cidr', 'serverGroup']);
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