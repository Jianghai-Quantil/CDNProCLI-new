import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from "../../util";
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const API_PERMISSION_CREATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
];

export function registerApiPermissionCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create')
    .description('Create an API permission set');

  registerOptionsFromMapping(cmd, API_PERMISSION_CREATE_OPTIONS);
  registerMappings('api-permission', 'create', API_PERMISSION_CREATE_OPTIONS);

  cmd.action(async (opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/apiPermissions', 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/apiPermissions', 'post', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro api-permission create --example', globals.output);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.apiPermissions.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
      const data = enrichWithLocationId(raw);
      const id = data['id'] as string;

      printCreateSuccess('API Permission', 'apiPermissionId', id, globals.output);
    } catch (err) {
      handleError(err);
    }
  });
}
