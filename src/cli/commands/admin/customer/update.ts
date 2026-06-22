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

export const ADMIN_CUSTOMER_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerAdminCustomerUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [id]')
    .description('Update a customer (PATCH)');

  registerOptionsFromMapping(cmd, ADMIN_CUSTOMER_UPDATE_OPTIONS);
  registerMappings('admin-customer', 'update', ADMIN_CUSTOMER_UPDATE_OPTIONS);

  cmd.action(async (id: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/ngadmin/customers/{id}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/ngadmin/customers/{id}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro admin customer update --example', globals.output);

      const reqOptions = {
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      await client.customers.update(id, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Customer ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
