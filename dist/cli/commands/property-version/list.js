"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_VERSION_LIST_OPTIONS = void 0;
exports.registerPropertyVersionListCommand = registerPropertyVersionListCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.PROPERTY_VERSION_LIST_OPTIONS = [
    { flag: '--search <term>', target: 'query', param: 'search', description: 'Match against version description' },
    ...option_map_1.SORT_OPTIONS,
    ...option_map_1.PAGINATION_OPTIONS,
    option_map_1.ALL,
];
function registerPropertyVersionListCommand(parent) {
    const cmd = parent
        .command('list <propertyId>')
        .description('List versions of a property');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.PROPERTY_VERSION_LIST_OPTIONS);
    (0, option_map_1.registerMappings)('property-version', 'list', exports.PROPERTY_VERSION_LIST_OPTIONS);
    cmd.action(async (propertyId, opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query, reqOptions } = (0, option_map_1.buildRequestFromMapping)(opts, exports.PROPERTY_VERSION_LIST_OPTIONS);
            if (opts.all) {
                const limit = 100;
                let offset = 0;
                while (true) {
                    const data = await client.properties.listVersions(propertyId, { ...query, limit, offset }, reqOptions);
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
            const limit = parseInt(String(opts.limit ?? '10'), 10);
            if (isNaN(limit) || limit < 1) {
                throw new errors_1.CliError('VALIDATION', `--limit must be a positive integer, got: ${opts.limit}`);
            }
            const offset = parseInt(String(opts.offset ?? '0'), 10);
            if (isNaN(offset) || offset < 0) {
                throw new errors_1.CliError('VALIDATION', `--offset must be a non-negative integer, got: ${opts.offset}`);
            }
            const data = await client.properties.listVersions(propertyId, { ...query, limit, offset }, reqOptions);
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