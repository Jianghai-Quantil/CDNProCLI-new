"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PURGE_TOKENS_OPTIONS = void 0;
exports.registerPurgeTokensCommand = registerPurgeTokensCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.PURGE_TOKENS_OPTIONS = [
    { flag: '--target <env>', target: 'query', param: 'target', description: 'Filter by environment: staging | production' },
];
function registerPurgeTokensCommand(parent) {
    const cmd = parent
        .command('tokens')
        .description('Get purge token quota information');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.PURGE_TOKENS_OPTIONS);
    (0, option_map_1.registerMappings)('purge', 'tokens', exports.PURGE_TOKENS_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query } = (0, option_map_1.buildRequestFromMapping)(opts, exports.PURGE_TOKENS_OPTIONS);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.purges.tokens(query, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=tokens.js.map