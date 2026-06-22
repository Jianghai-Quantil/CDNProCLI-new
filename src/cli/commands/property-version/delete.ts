import { Command } from 'commander';
import * as readline from 'readline';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { OptionMapping, CONFIRM, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const PROPERTY_VERSION_DELETE_OPTIONS: OptionMapping[] = [CONFIRM];

interface DeleteOpts {
  confirm?: boolean;
}

export function registerPropertyVersionDeleteCommand(parent: Command): void {
  registerMappings('property-version', 'delete', PROPERTY_VERSION_DELETE_OPTIONS);

  const cmd = parent
    .command('delete <propertyId> <version>')
    .description('Delete a property version');
  registerOptionsFromMapping(cmd, PROPERTY_VERSION_DELETE_OPTIONS);
  cmd.action(async (propertyId: string, version: string, opts: DeleteOpts, cmdObj: Command) => {
    try {
      if (!opts.confirm && process.stdout.isTTY) {
        const answer = await new Promise<string>((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Delete property "${propertyId}" version ${version}? [y/N] `, (ans) => {
            rl.close();
            resolve(ans);
          });
        });
        if (answer.toLowerCase() !== 'y') {
          process.stderr.write('Aborted.\n');
          process.exit(0);
        }
      }

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      await client.properties.deleteVersion(propertyId, version, reqOptions);

      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true, propertyId, version }) + '\n');
      } else {
        process.stderr.write(`Property ${propertyId} version ${version} deleted.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
