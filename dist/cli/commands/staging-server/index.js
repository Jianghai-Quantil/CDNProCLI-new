"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStagingServerCommands = registerStagingServerCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
function registerStagingServerCommands(parent) {
    const cmd = parent
        .command('staging-server')
        .description('List staging servers (read-only reference data)');
    const listCmd = cmd
        .command('list')
        .description('List staging servers');
    (0, option_map_1.registerMappings)('staging-server', 'list', []);
    listCmd.action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const data = await client.geo.stagingServers();
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