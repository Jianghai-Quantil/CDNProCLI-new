import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from "../../util";
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import { OptionMapping, FILE_EXAMPLE, IF_UNMODIFIED_SINCE, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const WEBHOOK_UPDATE_OPTIONS: OptionMapping[] = [...FILE_EXAMPLE, IF_UNMODIFIED_SINCE];

interface UpdateOpts {
  file?: string;
  example?: boolean;
  ifUnmodifiedSince?: string;
}

export function registerWebhookUpdateCommand(parent: Command): void {
  registerMappings('webhook', 'update', WEBHOOK_UPDATE_OPTIONS);

  const cmd = parent
    .command('update [id]')
    .description('Update a webhook (PATCH)');
  registerOptionsFromMapping(cmd, WEBHOOK_UPDATE_OPTIONS);
  cmd.action(async (id: string | undefined, opts: UpdateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/webhooks/{id}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file, "--file <path>");
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file);
      const validation = validateBody('/cdn/webhooks/{id}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro webhook update --example', globals.output);

      const headers: Record<string, string> = {};
      if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };

      await client.webhooks.update(id, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Webhook ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
