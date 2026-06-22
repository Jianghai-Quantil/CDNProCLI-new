import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { registerMappings } from '../../option-map';

export function registerStagingServerCommands(parent: Command): void {
  const cmd = parent
    .command('staging-server')
    .description('List staging servers (read-only reference data)');

  const listCmd = cmd
    .command('list')
    .description('List staging servers');

  registerMappings('staging-server', 'list', []);

  listCmd.action(async (opts: Record<string, unknown>, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const data = await client.geo.stagingServers();
        const { items, meta } = buildMeta(data);

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(items);
        } else if (effectiveFmt === 'jsonl') {
          printJsonl(items);
        } else {
          printJson(items, meta);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
