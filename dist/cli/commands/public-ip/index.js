"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPublicIpCommands = registerPublicIpCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
function registerPublicIpCommands(parent) {
    const cmd = parent
        .command('public-ip')
        .description('List CDN public IP ranges (read-only reference data)');
    const listCmd = cmd
        .command('list')
        .description('List CDN public IP ranges');
    (0, option_map_1.registerMappings)('public-ip', 'list', []);
    listCmd.action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const data = await client.geo.publicIpList();
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