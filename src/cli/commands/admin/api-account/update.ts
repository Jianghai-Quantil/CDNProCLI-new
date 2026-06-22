import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { handleError } from '../../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from "../../../util";
import { getExampleBody } from '../../../../schema/synthesize';
import { validateBody } from '../../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../../option-map';

export const ADMIN_API_ACCOUNT_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerAdminApiAccountUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [id]')
    .description('Update an API account (PATCH)');

  registerOptionsFromMapping(cmd, ADMIN_API_ACCOUNT_UPDATE_OPTIONS);
  registerMappings('admin-api-account', 'update', ADMIN_API_ACCOUNT_UPDATE_OPTIONS);

  cmd.action(async (id: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/ngadmin/apiAccounts/{id}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/ngadmin/apiAccounts/{id}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro admin api-account update --example', globals.output);

      const reqOptions = {
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      await client.apiAccounts.update(id, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`API account ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
