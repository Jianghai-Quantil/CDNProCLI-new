"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrefetchListCommand = registerPrefetchListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerPrefetchListCommand(parent) {
    parent
        .command('list')
        .description('List prefetch requests')
        .option('--from <date>', 'Start date (RFC 3339 UTC)')
        .option('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--search <term>', 'Keyword search')
        .option('--sort-by <field>', 'Sort field: submissionTime | finishTime')
        .option('--sort-order <order>', 'Sort direction: asc | desc')
        .option('--limit <n>', 'Page size [default: 10]')
        .option('--offset <n>', 'Page offset [default: 0]')
        .option('--all', 'Auto-paginate; implies --output jsonl')
        .option('--report-range <scope>', 'Report-Range header: self-only | self+children | children-only')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.from)
                query['startDate'] = opts.from;
            if (opts.to)
                query['endDate'] = opts.to;
            if (opts.search)
                query['search'] = opts.search;
            if (opts.sortBy)
                query['sortBy'] = opts.sortBy;
            if (opts.sortOrder)
                query['sortOrder'] = opts.sortOrder;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(opts.reportRange ? { reportRange: opts.reportRange } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            if (opts.all) {
                const limit = 100;
                let offset = 0;
                while (true) {
                    const data = await client.prefetches.list({ ...query, limit, offset }, reqOptions);
                    const { items } = (0, output_1.buildMeta)(data);
                    if (items.length === 0)
                        break;
                    (0, output_1.printJsonl)(items);
                    if (items.length < limit)
                        break;
                    offset += limit;
                }
                return;
            }
            const limit = parseInt(opts.limit ?? '10', 10);
            if (isNaN(limit) || limit < 1) {
                throw new errors_1.CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
            }
            const offset = parseInt(opts.offset ?? '0', 10);
            if (isNaN(offset) || offset < 0) {
                throw new errors_1.CliError('VALIDATION', `--offset must be a non-negative integer, got: ${opts.offset}`);
            }
            const data = await client.prefetches.list({ ...query, limit, offset }, reqOptions);
            const { items, meta } = (0, output_1.buildMeta)(data);
            meta.limit = limit;
            meta.offset = offset;
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