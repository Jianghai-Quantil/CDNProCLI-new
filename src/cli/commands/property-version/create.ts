import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId, checkRequiredOption } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const PROPERTY_VERSION_CREATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
];

export function registerPropertyVersionCreateCommand(parent: Command): void {
  const cmd = parent
    .command('create [propertyId]')
    .description('Create a new version of a property');

  registerOptionsFromMapping(cmd, PROPERTY_VERSION_CREATE_OPTIONS);
  registerMappings('property-version', 'create', PROPERTY_VERSION_CREATE_OPTIONS);

  cmd.action(async (propertyId: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/properties/{propertyID}/versions', 'post');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, '--file <path>');
      checkRequiredOption(propertyId, 'propertyId');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/properties/{propertyID}/versions', 'post', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro property-version create --example', globals.output);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const raw = await client.properties.createVersion(propertyId, body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
      const data = enrichWithLocationId(raw);
      const id = data['id'] as string;

      printCreateSuccess('Property Version', 'propertyVersionId', id, globals.output);
    } catch (err) {
      handleError(err);
    }
  });
}
