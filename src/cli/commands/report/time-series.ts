import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import {
  OptionMapping,
  REPORT_RANGE,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
  checkRequiredMappings,
} from '../../option-map';

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
  const options: OptionMapping[] = [
    { flag: '--from <date>',         target: 'query', param: 'startdate', description: 'Start date (RFC 3339 UTC)', required: true },
    { flag: '--to <date>',           target: 'query', param: 'enddate',   description: 'End date (RFC 3339 UTC)', required: true },
    { flag: '--type <granularity>',  target: 'query', param: 'type',      description: 'Granularity: fiveminutes | hourly | daily | monthly', required: true },
    ...FILE_EXAMPLE,
  ];

  if (!noScheme) {
    options.push({ flag: '--scheme <scheme>', target: 'query', param: 'scheme', description: 'Traffic type: http | https | all [default: all]' });
  }

  if (edgeHostnameFilter) {
    options.push({ flag: '--edge-hostname <h>', target: 'body', param: 'filters.edgeHostnames', description: 'Filter by edge hostname; repeatable', repeatable: true });
  } else {
    options.push(
      { flag: '--hostname <h>',          target: 'body', param: 'filters.hostnames',          description: 'Filter by client-facing hostname; repeatable',       repeatable: true },
      { flag: '--property <id>',         target: 'body', param: 'filters.propertyIds',        description: 'Filter by property ID; repeatable',                   repeatable: true },
      { flag: '--property-hostname <h>', target: 'body', param: 'filters.propertyHostnames',  description: 'Filter by property hostname pattern; repeatable',     repeatable: true },
      { flag: '--server-group <g>',      target: 'body', param: 'filters.serverGroups',       description: 'Filter by server group; repeatable',                  repeatable: true },
    );
  }

  if (!noReportRange) {
    options.push(REPORT_RANGE);
  }

  const cmd = parent
    .command(name)
    .description(desc);

  registerOptionsFromMapping(cmd, options);
  registerMappings('report', name, options);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody(path, 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredMappings(opts, options);

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      let body: unknown;
      const { query, reqOptions: mappedReqOptions, body: builtBody } = buildRequestFromMapping(opts, options);

      if (opts.file) {
        body = readBodyFile(opts.file as string);
      } else {
        body = builtBody;
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...mappedReqOptions,
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.report.post(path, { query, body }, reqOptions);
      printResult(data, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
