import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from "../../util";
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const LOG_CONFIG_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerLogConfigUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [id]')
    .description('Update a log delivery configuration (PATCH)');

  registerOptionsFromMapping(cmd, LOG_CONFIG_UPDATE_OPTIONS);
  registerMappings('log-config', 'update', LOG_CONFIG_UPDATE_OPTIONS);

  cmd.action(async (id: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/report/logConfigs/{id}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/report/logConfigs/{id}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro log-config update --example', globals.output);

      const headers: Record<string, string> = {};
      if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince as string;

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };

      await client.logConfigs.update(id, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Log config ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
