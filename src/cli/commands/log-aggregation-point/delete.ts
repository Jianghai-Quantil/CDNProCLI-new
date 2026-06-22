import { Command } from 'commander';
import * as readline from 'readline';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { OptionMapping, CONFIRM, registerOptionsFromMapping, registerMappings } from '../../option-map';

export const LOG_AGGREGATION_POINT_DELETE_OPTIONS: OptionMapping[] = [CONFIRM];

interface DeleteOpts {
  confirm?: boolean;
}

export function registerLogAggregationPointDeleteCommand(parent: Command): void {
  registerMappings('log-aggregation-point', 'delete', LOG_AGGREGATION_POINT_DELETE_OPTIONS);

  const cmd = parent
    .command('delete <id>')
    .description('Delete a log aggregation point');
  registerOptionsFromMapping(cmd, LOG_AGGREGATION_POINT_DELETE_OPTIONS);
  cmd.action(async (id: string, opts: DeleteOpts, cmdObj: Command) => {
    try {
      if (!opts.confirm && process.stdout.isTTY) {
        const answer = await new Promise<string>((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Delete log aggregation point "${id}"? [y/N] `, (ans) => { rl.close(); resolve(ans); });
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

      await client.logAggregationPoints.delete(id, reqOptions);

      if (!process.stdout.isTTY || globals.output) {
        process.stdout.write(JSON.stringify({ success: true, logAggregationPointId: id }) + '\n');
      } else {
        process.stderr.write(`Log aggregation point ${id} deleted.\n`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
