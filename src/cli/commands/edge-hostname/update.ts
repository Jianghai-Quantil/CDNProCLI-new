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

export const EDGE_HOSTNAME_UPDATE_OPTIONS: OptionMapping[] = [
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

export function registerEdgeHostnameUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [name]')
    .description('Partially update an edge hostname (PATCH)');

  registerOptionsFromMapping(cmd, EDGE_HOSTNAME_UPDATE_OPTIONS);
  registerMappings('edge-hostname', 'update', EDGE_HOSTNAME_UPDATE_OPTIONS);

  cmd.action(async (name: string | undefined, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      if (opts.example) {
        const example = getExampleBody('/cdn/edgeHostnames/{edgeHostname}', 'patch');
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      checkRequiredOption(opts.file as string | undefined, "--file <path>");
      checkRequiredOption(name, 'name');

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const body = readBodyFile(opts.file as string);
      const validation = validateBody('/cdn/edgeHostnames/{edgeHostname}', 'patch', body);
      if (!validation.valid) emitValidationError(validation, 'cdnpro edge-hostname update --example', globals.output);

      const headers: Record<string, string> = {};
      if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince as string;

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };

      await client.edgeHostnames.update(name, body, reqOptions);
      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        process.stderr.write(`Edge hostname ${name} updated.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
