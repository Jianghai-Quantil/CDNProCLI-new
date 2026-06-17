"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnnotationListCommand = registerAnnotationListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerAnnotationListCommand(parent) {
    parent
        .command('list')
        .description('List annotations')
        .option('--from <date>', 'Start date (RFC 3339 UTC)')
        .option('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--type <type>', 'Filter by type: client | configuration | operation')
        .option('--search <term>', 'Filter by ID or comment text')
        .option('--limit <n>', 'Page size [default: 10]')
        .option('--offset <n>', 'Page offset [default: 0]')
        .option('--all', 'Auto-paginate; implies --output jsonl')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            // annotation list uses POST /cdn/annotationsList with a filter body
            const filters = {};
            if (opts.from)
                filters['startDate'] = opts.from;
            if (opts.to)
                filters['endDate'] = opts.to;
            if (opts.type)
                filters['type'] = opts.type;
            if (opts.search)
                filters['search'] = opts.search;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            if (opts.all) {
                const limit = 100;
                let offset = 0;
                while (true) {
                    const data = await client.annotations.list({ ...filters, limit, offset }, reqOptions);
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
            const data = await client.annotations.list({ ...filters, limit, offset }, reqOptions);
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