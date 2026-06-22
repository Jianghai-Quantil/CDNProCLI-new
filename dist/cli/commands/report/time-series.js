"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTimeSeriesReportCommand = registerTimeSeriesReportCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const option_map_1 = require("../../option-map");
/**
 * Register a time-series report subcommand.
 *
 * @param parent  The `report` command
 * @param name    Subcommand name (e.g. "edge-bandwidth")
 * @param desc    Description shown in help
 * @param path    Full CDN Pro API path (e.g. "/cdn/report/bandwidth")
 * @param opts    Extra configuration flags
 */
function registerTimeSeriesReportCommand(parent, name, desc, path, { noScheme = false, noReportRange = false, edgeHostnameFilter = false } = {}) {
    const options = [
        { flag: '--from <date>', target: 'query', param: 'startdate', description: 'Start date (RFC 3339 UTC)', required: true },
        { flag: '--to <date>', target: 'query', param: 'enddate', description: 'End date (RFC 3339 UTC)', required: true },
        { flag: '--type <granularity>', target: 'query', param: 'type', description: 'Granularity: fiveminutes | hourly | daily | monthly', required: true },
        ...option_map_1.FILE_EXAMPLE,
    ];
    if (!noScheme) {
        options.push({ flag: '--scheme <scheme>', target: 'query', param: 'scheme', description: 'Traffic type: http | https | all [default: all]' });
    }
    if (edgeHostnameFilter) {
        options.push({ flag: '--edge-hostname <h>', target: 'body', param: 'filters.edgeHostnames', description: 'Filter by edge hostname; repeatable', repeatable: true });
    }
    else {
        options.push({ flag: '--hostname <h>', target: 'body', param: 'filters.hostnames', description: 'Filter by client-facing hostname; repeatable', repeatable: true }, { flag: '--property <id>', target: 'body', param: 'filters.propertyIds', description: 'Filter by property ID; repeatable', repeatable: true }, { flag: '--property-hostname <h>', target: 'body', param: 'filters.propertyHostnames', description: 'Filter by property hostname pattern; repeatable', repeatable: true }, { flag: '--server-group <g>', target: 'body', param: 'filters.serverGroups', description: 'Filter by server group; repeatable', repeatable: true });
    }
    if (!noReportRange) {
        options.push(option_map_1.REPORT_RANGE);
    }
    const cmd = parent
        .command(name)
        .description(desc);
    (0, option_map_1.registerOptionsFromMapping)(cmd, options);
    (0, option_map_1.registerMappings)('report', name, options);
    cmd.action(async (opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)(path, 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, option_map_1.checkRequiredMappings)(opts, options);
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            let body;
            const { query, reqOptions: mappedReqOptions, body: builtBody } = (0, option_map_1.buildRequestFromMapping)(opts, options);
            if (opts.file) {
                body = (0, util_1.readBodyFile)(opts.file);
            }
            else {
                body = builtBody;
            }
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...mappedReqOptions,
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
//# sourceMappingURL=time-series.js.map