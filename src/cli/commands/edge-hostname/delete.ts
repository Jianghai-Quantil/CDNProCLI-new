import { Command } from 'commander';
import * as readline from 'readline';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { OptionMapping, CONFIRM, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const EDGE_HOSTNAME_DELETE_OPTIONS: OptionMapping[] = [
  CONFIRM,
  {
    flag: '--skip-usage-check',
    target: 'header',
    param: 'Check-Usage',
    description: 'Send Check-Usage: no — skip dependency safety check',
    boolean: true,
  },
];

interface DeleteOpts {
  confirm?: boolean;
  skipUsageCheck?: boolean;
}

export function registerEdgeHostnameDeleteCommand(parent: Command): void {
  registerMappings('edge-hostname', 'delete', EDGE_HOSTNAME_DELETE_OPTIONS);

  const cmd = parent
    .command('delete <name>')
    .description('Delete an edge hostname');
  registerOptionsFromMapping(cmd, EDGE_HOSTNAME_DELETE_OPTIONS);
  cmd.action(async (name: string, opts: DeleteOpts, cmdObj: Command) => {
    try {
      if (!opts.confirm && process.stdout.isTTY) {
        const answer = await new Promise<string>((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Delete edge hostname "${name}"? [y/N] `, (ans) => { rl.close(); resolve(ans); });
        });
        if (answer.toLowerCase() !== 'y') {
          process.stderr.write('Aborted.\n');
          process.exit(0);
        }
      }

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      const headers: Record<string, string> = {};
      if (opts.skipUsageCheck) headers['Check-Usage'] = 'no';

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };

      await client.edgeHostnames.delete(name, reqOptions);

      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true, edgeHostname: name }) + '\n');
      } else {
        process.stderr.write(`Edge hostname ${name} deleted.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
