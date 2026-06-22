import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';
import { OptionMapping, FILE_EXAMPLE, IF_UNMODIFIED_SINCE, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const PROPERTY_UPDATE_OPTIONS: OptionMapping[] = [...FILE_EXAMPLE, IF_UNMODIFIED_SINCE];

interface UpdateOpts {
  file?: string;
  ifUnmodifiedSince?: string;
  example?: boolean;
}

export function registerPropertyUpdateCommand(parent: Command): void {
  registerMappings('property', 'update', PROPERTY_UPDATE_OPTIONS);

  const cmd = parent
    .command('update [id]')
    .description('Update a property (PATCH)');
  registerOptionsFromMapping(cmd, PROPERTY_UPDATE_OPTIONS);
  cmd.action(async (id: string | undefined, opts: UpdateOpts, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/properties/{propertyID}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file, '--file <path>');
      checkRequiredOption(id, 'id');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const body = readBodyFile(opts.file);
      const validation = validateBody('/cdn/properties/{propertyID}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro property update --example', globals.output);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(opts.ifUnmodifiedSince
          ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } }
          : {}),
      };

      await client.properties.update(id, body, reqOptions);
      // 204 No Content — emit a minimal success response
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Property ${id} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
