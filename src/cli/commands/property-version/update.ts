import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const PROPERTY_VERSION_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerPropertyVersionUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [propertyId] [version]')
    .description('Update a property version (PATCH)');

  registerOptionsFromMapping(cmd, PROPERTY_VERSION_UPDATE_OPTIONS);
  registerMappings('property-version', 'update', PROPERTY_VERSION_UPDATE_OPTIONS);

  cmd.action(async (propertyId: string | undefined, version: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/properties/{propertyID}/versions/{version}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, '--file <path>');
      checkRequiredOption(propertyId, 'propertyId');
      checkRequiredOption(version, 'version');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/properties/{propertyID}/versions/{version}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro property-version update --example', globals.output);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(opts.ifUnmodifiedSince
          ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince as string } }
          : {}),
      };

      await client.properties.patchVersion(propertyId, version, body, reqOptions);

      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Property ${propertyId} version ${version} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
