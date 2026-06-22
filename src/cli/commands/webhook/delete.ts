import { Command } from 'commander';
import * as readline from 'readline';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { OptionMapping, CONFIRM, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const WEBHOOK_DELETE_OPTIONS: OptionMapping[] = [CONFIRM];

interface DeleteOpts {
  confirm?: boolean;
}

export function registerWebhookDeleteCommand(parent: Command): void {
  registerMappings('webhook', 'delete', WEBHOOK_DELETE_OPTIONS);

  const cmd = parent
    .command('delete <id>')
    .description('Delete a webhook');
  registerOptionsFromMapping(cmd, WEBHOOK_DELETE_OPTIONS);
  cmd.action(async (id: string, opts: DeleteOpts, cmdObj: Command) => {
    try {
      if (!opts.confirm && process.stdout.isTTY) {
        const answer = await new Promise<string>((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Delete webhook "${id}"? [y/N] `, (ans) => { rl.close(); resolve(ans); });
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

      await client.webhooks.delete(id, reqOptions);

      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true, webhookId: id }) + '\n');
      } else {
        process.stderr.write(`Webhook ${id} deleted.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
