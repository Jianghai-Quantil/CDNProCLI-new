import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { print, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile } from '../../util';

interface TimeSeriesOpts {
  from: string;
  to: string;
  type: string;
  scheme?: string;
  hostname?: string[];
  property?: string[];
  propertyHostname?: string[];
  serverGroup?: string[];
  file?: string;
  reportRange?: string;
}

/**
 * Register a time-series report subcommand.
 *
 * @param parent  The `report` command
 * @param name    Subcommand name (e.g. "edge-bandwidth")
 * @param desc    Description shown in help
 * @param path    Full CDN Pro API path (e.g. "/cdn/report/bandwidth")
 * @param opts    Extra configuration flags
 */
export function registerTimeSeriesReportCommand(
  parent: Command,
  name: string,
  desc: string,
  path: string,
  { noScheme = false, noReportRange = false, edgeHostnameFilter = false } = {},
): void {
  const cmd = parent
    .command(name)
    .description(desc)
    .requiredOption('--from <date>', 'Start date (RFC 3339 UTC)')
    .requiredOption('--to <date>', 'End date (RFC 3339 UTC)')
    .requiredOption('--type <granularity>', 'Granularity: fiveminutes | hourly | daily | monthly')
    .option('--file <path>', 'Full filters body as JSON; overrides filter flags (- for stdin)');

  if (!noScheme) {
    cmd.option('--scheme <scheme>', 'Traffic type: http | https | all [default: all]');
  }

  if (edgeHostnameFilter) {
    cmd.option(
      '--edge-hostname <h>',
      'Filter by edge hostname; repeatable',
      (v: string, prev: string[]) => [...prev, v],
      [] as string[],
    );
  } else {
    cmd
      .option('--hostname <h>', 'Filter by client-facing hostname; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
      .option('--property <id>', 'Filter by property ID; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
      .option('--property-hostname <h>', 'Filter by property hostname pattern; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
      .option('--server-group <g>', 'Filter by server group; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[]);
  }

  if (!noReportRange) {
    cmd.option('--report-range <scope>', 'Report-Range header: self-only | self+children | children-only');
  }

  cmd.action(async (opts: TimeSeriesOpts & { edgeHostname?: string[] }, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
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
          granularity: opts.type,
        };

        if (!noScheme && opts.scheme) filters['scheme'] = opts.scheme;

        if (edgeHostnameFilter) {
          if ((opts.edgeHostname ?? []).length > 0) filters['edgeHostnames'] = opts.edgeHostname;
        } else {
          if ((opts.hostname ?? []).length > 0) filters['hostnames'] = opts.hostname;
          if ((opts.property ?? []).length > 0) filters['propertyIds'] = opts.property;
          if ((opts.propertyHostname ?? []).length > 0) filters['propertyHostnames'] = opts.propertyHostname;
          if ((opts.serverGroup ?? []).length > 0) filters['serverGroups'] = opts.serverGroup;
        }

        body = filters;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(!noReportRange && opts.reportRange ? { reportRange: opts.reportRange } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.report.post(path, { body }, reqOptions);
      print(data, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
