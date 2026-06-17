import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, printJsonl, buildMeta, OutputFormat } from '../../output';
import { handleError } from '../../errors';

export function registerPublicIpCommands(parent: Command): void {
  const cmd = parent
    .command('public-ip')
    .description('List CDN public IP ranges (read-only reference data)');

  cmd
    .command('list')
    .description('List CDN public IP ranges')
    .action(async (opts: Record<string, unknown>, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const data = await client.geo.publicIpList();
        const { items, meta } = buildMeta(data);

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(items, ['ip', 'cidr', 'serverGroup']);
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
