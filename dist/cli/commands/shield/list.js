"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIELD_LIST_OPTIONS = void 0;
exports.registerShieldListCommand = registerShieldListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.SHIELD_LIST_OPTIONS = [
    { flag: '--search <term>', target: 'query', param: 'search', description: 'Keyword search' },
    { flag: '--used-in-properties', target: 'query', param: 'usedInProperties', description: 'Filter to shields referenced by at least one property', boolean: true },
    ...option_map_1.SORT_OPTIONS,
];
function registerShieldListCommand(parent) {
    const cmd = parent
        .command('list')
        .description('List origin shields');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.SHIELD_LIST_OPTIONS);
    (0, option_map_1.registerMappings)('shield', 'list', exports.SHIELD_LIST_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query, reqOptions: mappedReqOptions } = (0, option_map_1.buildRequestFromMapping)(opts, exports.SHIELD_LIST_OPTIONS);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...mappedReqOptions,
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