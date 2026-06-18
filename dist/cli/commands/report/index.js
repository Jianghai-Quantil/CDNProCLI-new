"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReportCommands = registerReportCommands;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const time_series_1 = require("./time-series");
const summary_1 = require("./summary");
function registerReportCommands(parent) {
    const report = parent
        .command('report')
        .description('Fetch CDN traffic and usage reports');
    // ── Time-series reports ──────────────────────────────────────────────
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-bandwidth', 'Edge bandwidth by time period', '/cdn/report/bandwidth');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-volume', 'Edge download volume by time period', '/cdn/report/vol');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-upload-volume', 'Edge upload volume by time period', '/cdn/report/upVol');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-requests', 'Edge request count by time period', '/cdn/report/req');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-status-codes', 'Edge HTTP status code breakdown', '/cdn/report/statusCodeDetails');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'origin-volume', 'Origin volume by time period', '/cdn/report/volOrigin');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'origin-requests', 'Origin request count by time period', '/cdn/report/reqOrigin');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'origin-status-codes', 'Origin HTTP status code breakdown', '/cdn/report/statusCodeDetailsOrigin');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'interm-volume', 'Intermediate node volume by period', '/cdn/report/volInterm');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'cpu-time', 'CPU time by time period', '/cdn/report/cpuTime');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'origin-fast-route-requests', 'Origin fast-route requests', '/cdn/report/fastOriginReq');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'origin-fast-route-volume', 'Origin fast-route volume', '/cdn/report/fastOriginVol');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'l7-volume', 'L7 volume by time period', '/cdn/report/volL7');
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'l7-bandwidth', 'L7 bandwidth by time period', '/cdn/report/bandwidthL7');
    // edge-hostname-requests: no --scheme, no --report-range, uses edgeHostname filter
    (0, time_series_1.registerTimeSeriesReportCommand)(report, 'edge-hostname-requests', 'Edge hostname request count by time period', '/cdn/report/edgeHostnameReq', { noScheme: true, noReportRange: true, edgeHostnameFilter: true });
    // ── Summary reports ──────────────────────────────────────────────────
    (0, summary_1.registerSummaryReportCommand)(report, 'edge-bandwidth-summary', 'Edge bandwidth summary', '/cdn/report/bandwidthSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'edge-volume-summary', 'Edge download volume summary', '/cdn/report/volSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'edge-requests-summary', 'Edge request count summary', '/cdn/report/reqSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'edge-status-summary', 'Edge HTTP status code summary', '/cdn/report/edgeStatusSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'origin-status-summary', 'Origin HTTP status code summary', '/cdn/report/originStatusSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'cpu-summary', 'CPU time summary', '/cdn/report/cpuSummary');
    (0, summary_1.registerSummaryReportCommand)(report, 'l7-volume-summary', 'L7 volume summary', '/cdn/report/volL7Summary');
    (0, summary_1.registerSummaryReportCommand)(report, 'l7-bandwidth-summary', 'L7 bandwidth summary', '/cdn/report/bandwidthL7Summary');
    // edge-hostname-requests-summary: no --scheme, uses edgeHostname filter, no group-by
    (0, summary_1.registerSummaryReportCommand)(report, 'edge-hostname-requests-summary', 'Edge hostname request count summary', '/cdn/report/edgeHostnameReqSummary', { noScheme: true, edgeHostnameFilter: true });
    // ── Log download ─────────────────────────────────────────────────────
    report
        .command('logs')
        .description('Request log download links')
        .requiredOption('--from <date>', 'Start date (RFC 3339 UTC)')
        .requiredOption('--to <date>', 'End date (RFC 3339 UTC)')
        .option('--hostname <h>', 'Filter by hostname; repeatable', (v, prev) => [...prev, v], [])
        .option('--file <path>', 'Full filters body as JSON; overrides filter flags (- for stdin)')
        .action(async (opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
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
                const filters = {};
                if ((opts.hostname ?? []).length > 0)
                    filters['hostnames'] = opts.hostname;
                body = Object.keys(filters).length > 0 ? { filters } : undefined;
            }
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.report.post('/cdn/report/logDownload', { query, body }, reqOptions);
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=index.js.map