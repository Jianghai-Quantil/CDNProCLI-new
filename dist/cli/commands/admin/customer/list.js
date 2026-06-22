"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminCustomerListCommand = registerAdminCustomerListCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
const option_map_1 = require("../../../option-map");
function registerAdminCustomerListCommand(parent) {
    const ADMIN_CUSTOMER_LIST_OPTIONS = [
        { flag: '--search <term>', target: 'query', param: 'search', description: 'Keyword search' },
        { flag: '--ids <id,...>', target: 'query', param: 'ids', description: 'Comma-separated customer IDs to filter' },
        { flag: '--status <status>', target: 'query', param: 'status', description: 'Filter by status: active | suspended' },
        { flag: '--products <product,...>', target: 'query', param: 'products', description: 'Filter by product codes' },
        { flag: '--regional-offices <office,...>', target: 'query', param: 'regionalOffices', description: 'Filter by regional office codes' },
        ...option_map_1.SORT_OPTIONS,
        ...option_map_1.PAGINATION_OPTIONS,
        option_map_1.ALL,
    ];
    (0, option_map_1.registerMappings)('admin-customer', 'list', ADMIN_CUSTOMER_LIST_OPTIONS);
    const cmd = parent
        .command('list')
        .description('List customers');
    (0, option_map_1.registerOptionsFromMapping)(cmd, ADMIN_CUSTOMER_LIST_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const query = {};
            if (opts.search)
                query['search'] = opts.search;
            if (opts.ids)
                query['ids'] = opts.ids;
            if (opts.status)
                query['status'] = opts.status;
            if (opts.products)
                query['products'] = opts.products;
            if (opts.regionalOffices)
                query['regionalOffices'] = opts.regionalOffices;
            if (opts.sortBy)
                query['sortBy'] = opts.sortBy;
            if (opts.sortOrder)
                query['sortOrder'] = opts.sortOrder;
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            if (opts.all) {
                const limit = 100;
                let offset = 0;
                while (true) {
                    const data = await client.customers.list({ ...query, limit, offset }, reqOptions);
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
            const data = await client.customers.list({ ...query, limit, offset }, reqOptions);
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