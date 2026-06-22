import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../../config';
import { CDNProClient } from '../../../../client/CDNProClient';
import { printCreateSuccess } from '../../../output';
import { handleError } from '../../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../../util';
import { getExampleBody } from '../../../../schema/synthesize';
import { validateBody } from '../../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../../option-map';

export const ADMIN_CUSTOMER_CREATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
];

export function registerAdminCustomerCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create')
    .description('Create a customer');

  registerOptionsFromMapping(cmd, ADMIN_CUSTOMER_CREATE_OPTIONS);
  registerMappings('admin-customer', 'create', ADMIN_CUSTOMER_CREATE_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/ngadmin/customers', 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, '--file <path>');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/ngadmin/customers', 'post', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro admin customer create --example', globals.output);

      const reqOptions = {
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.customers.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
      const data = enrichWithLocationId(raw);
      const id = data['id'] as string;

      printCreateSuccess('Customer', 'customerId', id, globals.output);
    } catch (err) {
      handleError(err);
    }
  });
}
