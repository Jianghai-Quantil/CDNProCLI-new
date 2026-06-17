"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiCallListCommand = registerAdminApiCallListCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
function registerAdminApiCallListCommand(parent) {
    parent
        .command('list')
        .description('List API call log entries')
        .option('--from <date>', 'Start date (RFC 3339 UTC or relative: 7d, 24H, 1M)')
        .option('--to <date>', 'End date (RFC 3339 UTC or relative)')
        .option('--method <method>', 'Filter by HTTP method: GET | POST | PATCH | PUT | DELETE')
        .option('--path <uri>', 'Filter by API path')
        .option('--safe <bool>', 'Filter by safe flag: true | false')
        .option('--caller <name-or-id>', 'Filter by API account name or ID')
        .option('--for-customer <id>', 'Filter by on-behalf-of customer: customer ID | none | any')
        .option('--status <code,...>', 'Filter by HTTP status codes or patterns (2xx, 4xx, etc.)')
        .option('--before <apiRequestId>', 'Cursor for pagination: return calls before this request ID')
        .option('--limit <n>', 'Page size [default: 100, max: 100]')
        .option('--all', 'Auto-paginate using cursor (--before); implies --output jsonl')
        .option('--report-range <scope>', 'Report-Range header: self-only | self+children | children-only')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.from)
                query['startdate'] = opts.from;
            if (opts.to)
                query['enddate'] = opts.to;
            if (opts.method)
                query['method'] = opts.method;
            if (opts.path)
                query['path'] = opts.path;
            if (opts.safe !== undefined)
                query['safe'] = opts.safe;
            if (opts.caller)
                query['caller'] = opts.caller;
            if (opts.forCustomer)
                query['forCustomer'] = opts.forCustomer;
            if (opts.status)
                query['status'] = opts.status;
            const reqOptions = {
                ...(opts.reportRange ? { reportRange: opts.reportRange } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const limit = parseInt(opts.limit ?? '100', 10);
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