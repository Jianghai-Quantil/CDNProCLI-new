"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOSTNAME_HISTORY_GET_OPTIONS = void 0;
exports.registerHostnameHistoryGetCommand = registerHostnameHistoryGetCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.HOSTNAME_HISTORY_GET_OPTIONS = [
    { flag: '--from <date>', target: 'query', param: 'from', description: 'Start date (RFC 3339 UTC)' },
    { flag: '--to <date>', target: 'query', param: 'to', description: 'End date (RFC 3339 UTC)' },
    { flag: '--target <target>', target: 'query', param: 'target', description: 'Filter by deployment target: staging | production | all' },
];
function registerHostnameHistoryGetCommand(parent) {
    (0, option_map_1.registerMappings)('hostname-history', 'get', exports.HOSTNAME_HISTORY_GET_OPTIONS);
    const cmd = parent
        .command('get <hostname>')
        .description('Get deployment history for a specific hostname');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.HOSTNAME_HISTORY_GET_OPTIONS);
    cmd.action(async (hostname, opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.from)
                query['from'] = opts.from;
            if (opts.to)
                query['to'] = opts.to;
            if (opts.target)
                query['target'] = opts.target;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.hostnameHistory.get(hostname, query, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map