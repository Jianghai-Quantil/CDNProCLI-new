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

export const SERVICE_QUOTA_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerServiceQuotaUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [id]')
    .description('Update a service quota (PATCH)');

  registerOptionsFromMapping(cmd, SERVICE_QUOTA_UPDATE_OPTIONS);
  registerMappings('service-quota', 'update', SERVICE_QUOTA_UPDATE_OPTIONS);

  cmd.action(async (id: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/serviceQuotas/{serviceQuotaId}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/serviceQuotas/{serviceQuotaId}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro service-quota update --example', globals.output);

      const headers: Record<string, string> = {};
      if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince as string;

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };

      await client.serviceQuotas.update(id, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Service quota ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
