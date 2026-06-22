"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APICALL_LIST_OPTIONS = void 0;
exports.registerAdminApiCallListCommand = registerAdminApiCallListCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
const option_map_1 = require("../../../option-map");
exports.APICALL_LIST_OPTIONS = [
    { flag: '--from <date>', target: 'query', param: 'startdate', description: 'Start date (RFC 3339 UTC or relative: 7d, 24H, 1M)' },
    { flag: '--to <date>', target: 'query', param: 'enddate', description: 'End date (RFC 3339 UTC or relative)' },
    { flag: '--method <method>', target: 'query', param: 'method', description: 'Filter by HTTP method: GET | POST | PATCH | PUT | DELETE' },
    { flag: '--path <uri>', target: 'query', param: 'path', description: 'Filter by API path' },
    { flag: '--safe <bool>', target: 'query', param: 'safe', description: 'Filter by safe flag: true | false' },
    { flag: '--caller <name-or-id>', target: 'query', param: 'caller', description: 'Filter by API account name or ID' },
    { flag: '--for-customer <id>', target: 'query', param: 'forCustomer', description: 'Filter by on-behalf-of customer: customer ID | none | any' },
    { flag: '--status <code,...>', target: 'query', param: 'status', description: 'Filter by HTTP status codes or patterns (2xx, 4xx, etc.)' },
    { flag: '--before <apiRequestId>', target: 'query', param: 'before', description: 'Cursor for pagination: return calls before this request ID' },
    { flag: '--limit <n>', target: 'query', param: 'limit', description: 'Page size [default: 100, max: 100]' },
    option_map_1.REPORT_RANGE,
    option_map_1.ALL,
];
function registerAdminApiCallListCommand(parent) {
    const cmd = parent
        .command('list')
        .description('List API call log entries');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.APICALL_LIST_OPTIONS);
    (0, option_map_1.registerMappings)('apicall', 'list', exports.APICALL_LIST_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query, reqOptions } = (0, option_map_1.buildRequestFromMapping)(opts, exports.APICALL_LIST_OPTIONS);
            const limit = parseInt(String(opts.limit ?? '100'), 10);
            if (isNaN(limit) || limit < 1) {
                throw new errors_1.CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
            }
            if (opts.all) {
                let before;
                while (true) {
                    const pageQuery = { ...query, limit, ...(before ? { before } : {}) };
                    const data = await client.apiCalls.list(pageQuery, reqOptions);
                    const { items } = (0, output_1.buildMeta)(data);
                    if (items.length === 0)
                        break;
                    (0, output_1.printJsonl)(items);
                    if (items.length < limit)
                        break;
                    // Use the last item's apiRequestId as the cursor
                    const last = items[items.length - 1];
                    before = last['apiRequestId'];
                    if (!before)
                        break;
                }
                return;
            }
            const pageQuery = { ...query, limit };
            if (opts.before)
                pageQuery['before'] = opts.before;
            const data = await client.apiCalls.list(pageQuery, reqOptions);
            const { items, meta } = (0, output_1.buildMeta)(data);
            meta.limit = limit;
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