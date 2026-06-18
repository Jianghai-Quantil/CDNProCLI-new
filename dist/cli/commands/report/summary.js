"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSummaryReportCommand = registerSummaryReportCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
/**
 * Register a summary report subcommand (no --type, no --report-range, adds --group-by).
 */
function registerSummaryReportCommand(parent, name, desc, path, { noScheme = false, edgeHostnameFilter = false } = {}) {
    const cmd = parent
        .command(name)
        .description(desc)
        .option('--from <date>', 'Start date (RFC 3339 UTC)')
        .option('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--file <path>', 'Full filters body as JSON; overrides filter flags (- for stdin)')
        .option('--example', 'Print an example request body and exit');
    if (!noScheme) {
        cmd.option('--scheme <scheme>', 'Traffic type: http | https | all [default: all]');
    }
    if (edgeHostnameFilter) {
        cmd.option('--edge-hostname <h>', 'Filter by edge hostname; repeatable', (v, prev) => [...prev, v], []);
    }
    else {
        cmd
            .option('--hostname <h>', 'Filter by client-facing hostname; repeatable', (v, prev) => [...prev, v], [])
            .option('--property <id>', 'Filter by property ID; repeatable', (v, prev) => [...prev, v], [])
            .option('--property-hostname <h>', 'Filter by property hostname pattern; repeatable', (v, prev) => [...prev, v], [])
            .option('--server-group <g>', 'Filter by server group; repeatable', (v, prev) => [...prev, v], [])
            .option('--group-by <field>', 'Group-by field; repeatable (up to 2): hostnames | serverGroups | customerIds | propertyHostnames | legacyTypes', (v, prev) => [...prev, v], []);
    }
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)(path, 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.from, '--from <date>');
            (0, util_1.checkRequiredOption)(opts.to, '--to <date>');
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            let body;
            const query = {};
            if (opts.file) {
                body = (0, util_1.readBodyFile)(opts.file);
            }
            else {
                query.startdate = opts.from;
                query.enddate = opts.to;
                if (!noScheme && opts.scheme)
                    query.scheme = opts.scheme;
                const filters = {};
                const bodyObj = {};
                if (edgeHostnameFilter) {
                    if ((opts.edgeHostname ?? []).length > 0)
                        filters['edgeHostnames'] = opts.edgeHostname;
                }
                else {
                    if ((opts.hostname ?? []).length > 0)
                        filters['hostnames'] = opts.hostname;
                    if ((opts.property ?? []).length > 0)
                        filters['propertyIds'] = opts.property;
                    if ((opts.propertyHostname ?? []).length > 0)
                        filters['propertyHostnames'] = opts.propertyHostname;
                    if ((opts.serverGroup ?? []).length > 0)
                        filters['serverGroups'] = opts.serverGroup;
                    if ((opts.groupBy ?? []).length > 0)
                        bodyObj['groupBy'] = opts.groupBy;
                }
                if (Object.keys(filters).length > 0)
                    bodyObj['filters'] = filters;
                body = Object.keys(bodyObj).length > 0 ? bodyObj : undefined;
            }
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.report.post(path, { query, body }, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=summary.js.map