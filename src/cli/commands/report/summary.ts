import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile } from '../../util';

interface SummaryOpts {
  from: string;
  to: string;
  scheme?: string;
  hostname?: string[];
  property?: string[];
  propertyHostname?: string[];
  serverGroup?: string[];
  groupBy?: string[];
  file?: string;
}

/**
 * Register a summary report subcommand (no --type, no --report-range, adds --group-by).
 */
export function registerSummaryReportCommand(
  parent: Command,
  name: string,
  desc: string,
  path: string,
  { noScheme = false, edgeHostnameFilter = false } = {},
): void {
  const cmd = parent
    .command(name)
    .description(desc)
    .requiredOption('--from <date>', 'Start date (RFC 3339 UTC)')
    .requiredOption('--to <date>', 'End date (RFC 3339 UTC)')
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
      .option('--server-group <g>', 'Filter by server group; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
      .option(
        '--group-by <field>',
        'Group-by field; repeatable (up to 2): hostnames | serverGroups | customerIds | propertyHostnames | legacyTypes',
        (v: string, prev: string[]) => [...prev, v],
        [] as string[],
      );
  }

  cmd.action(async (opts: SummaryOpts & { edgeHostname?: string[] }, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      if (!opts.from || !opts.to) {
        throw new CliError('VALIDATION', '--from and --to are required');
      }

      let body: unknown;

      if (opts.file) {
        body = readBodyFile(opts.file);
      } else {
        const filters: Record<string, unknown> = {
          startDate: opts.from,
          endDate: opts.to,
        };

        if (!noScheme && opts.scheme) filters['scheme'] = opts.scheme;

        if (edgeHostnameFilter) {
          if ((opts.edgeHostname ?? []).length > 0) filters['edgeHostnames'] = opts.edgeHostname;
        } else {
          if ((opts.hostname ?? []).length > 0) filters['hostnames'] = opts.hostname;
          if ((opts.property ?? []).length > 0) filters['propertyIds'] = opts.property;
          if ((opts.propertyHostname ?? []).length > 0) filters['propertyHostnames'] = opts.propertyHostname;
          if ((opts.serverGroup ?? []).length > 0) filters['serverGroups'] = opts.serverGroup;
          if ((opts.groupBy ?? []).length > 0) filters['groupBy'] = opts.groupBy;
        }

        body = filters;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.report.post(path, { body }, reqOptions);
      printResult(data, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
