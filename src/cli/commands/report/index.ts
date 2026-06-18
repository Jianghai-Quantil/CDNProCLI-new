import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile } from '../../util';
import { registerTimeSeriesReportCommand } from './time-series';
import { registerSummaryReportCommand } from './summary';

export function registerReportCommands(parent: Command): void {
  const report = parent
    .command('report')
    .description('Fetch CDN traffic and usage reports');

  // ── Time-series reports ──────────────────────────────────────────────
  registerTimeSeriesReportCommand(report, 'edge-bandwidth',      'Edge bandwidth by time period',          '/cdn/report/bandwidth');
  registerTimeSeriesReportCommand(report, 'edge-volume',         'Edge download volume by time period',    '/cdn/report/vol');
  registerTimeSeriesReportCommand(report, 'edge-upload-volume',  'Edge upload volume by time period',      '/cdn/report/upVol');
  registerTimeSeriesReportCommand(report, 'edge-requests',       'Edge request count by time period',      '/cdn/report/req');
  registerTimeSeriesReportCommand(report, 'edge-status-codes',   'Edge HTTP status code breakdown',        '/cdn/report/statusCodeDetails');
  registerTimeSeriesReportCommand(report, 'origin-volume',       'Origin volume by time period',           '/cdn/report/volOrigin');
  registerTimeSeriesReportCommand(report, 'origin-requests',     'Origin request count by time period',    '/cdn/report/reqOrigin');
  registerTimeSeriesReportCommand(report, 'origin-status-codes', 'Origin HTTP status code breakdown',      '/cdn/report/statusCodeDetailsOrigin');
  registerTimeSeriesReportCommand(report, 'interm-volume',       'Intermediate node volume by period',     '/cdn/report/volInterm');
  registerTimeSeriesReportCommand(report, 'cpu-time',            'CPU time by time period',                '/cdn/report/cpuTime');
  registerTimeSeriesReportCommand(report, 'origin-fast-route-requests', 'Origin fast-route requests',     '/cdn/report/fastOriginReq');
  registerTimeSeriesReportCommand(report, 'origin-fast-route-volume',   'Origin fast-route volume',       '/cdn/report/fastOriginVol');
  registerTimeSeriesReportCommand(report, 'l7-volume',           'L7 volume by time period',               '/cdn/report/volL7');
  registerTimeSeriesReportCommand(report, 'l7-bandwidth',        'L7 bandwidth by time period',            '/cdn/report/bandwidthL7');

  // edge-hostname-requests: no --scheme, no --report-range, uses edgeHostname filter
  registerTimeSeriesReportCommand(
    report,
    'edge-hostname-requests',
    'Edge hostname request count by time period',
    '/cdn/report/edgeHostnameReq',
    { noScheme: true, noReportRange: true, edgeHostnameFilter: true },
  );

  // ── Summary reports ──────────────────────────────────────────────────
  registerSummaryReportCommand(report, 'edge-bandwidth-summary',          'Edge bandwidth summary',                   '/cdn/report/bandwidthSummary');
  registerSummaryReportCommand(report, 'edge-volume-summary',             'Edge download volume summary',             '/cdn/report/volSummary');
  registerSummaryReportCommand(report, 'edge-requests-summary',           'Edge request count summary',               '/cdn/report/reqSummary');
  registerSummaryReportCommand(report, 'edge-status-summary',             'Edge HTTP status code summary',            '/cdn/report/edgeStatusSummary');
  registerSummaryReportCommand(report, 'origin-status-summary',           'Origin HTTP status code summary',          '/cdn/report/originStatusSummary');
  registerSummaryReportCommand(report, 'cpu-summary',                     'CPU time summary',                         '/cdn/report/cpuSummary');
  registerSummaryReportCommand(report, 'l7-volume-summary',               'L7 volume summary',                        '/cdn/report/volL7Summary');
  registerSummaryReportCommand(report, 'l7-bandwidth-summary',            'L7 bandwidth summary',                     '/cdn/report/bandwidthL7Summary');

  // edge-hostname-requests-summary: no --scheme, uses edgeHostname filter, no group-by
  registerSummaryReportCommand(
    report,
    'edge-hostname-requests-summary',
    'Edge hostname request count summary',
    '/cdn/report/edgeHostnameReqSummary',
    { noScheme: true, edgeHostnameFilter: true },
  );

  // ── Log download ─────────────────────────────────────────────────────
  report
    .command('logs')
    .description('Request log download links')
    .requiredOption('--from <date>', 'Start date (RFC 3339 UTC)')
    .requiredOption('--to <date>', 'End date (RFC 3339 UTC)')
    .option('--hostname <h>', 'Filter by hostname; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--file <path>', 'Full filters body as JSON; overrides filter flags (- for stdin)')
    .action(async (opts: { from: string; to: string; hostname?: string[]; file?: string }, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        let body: unknown;
        if (opts.file) {
          body = readBodyFile(opts.file);
        } else {
          const filters: Record<string, unknown> = {
            startDate: opts.from,
            endDate: opts.to,
          };
          if ((opts.hostname ?? []).length > 0) filters['hostnames'] = opts.hostname;
          body = filters;
        }

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.report.post('/cdn/report/logDownload', { body }, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
