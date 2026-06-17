import * as fs from 'fs';
import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';

interface DownloadCsrOpts {
  dcv?: string;
  out?: string;
}

export function registerCertDownloadCsrCommand(parent: Command): void {
  parent
    .command('download-csr <id>')
    .description('Download the CSR for a certificate')
    .option('--dcv <provider>', 'DCV provider (e.g. sectigo)')
    .option('--out <file>', 'Write CSR to file instead of stdout')
    .action(async (id: string, opts: DownloadCsrOpts, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const query: Record<string, unknown> = {};
        if (opts.dcv) query['dcv'] = opts.dcv;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.certificates.downloadCSR(id, query, reqOptions);

        if (opts.out) {
          const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          try {
            fs.writeFileSync(opts.out, content);
          } catch (e) {
            throw new CliError('ERROR', `Cannot write to "${opts.out}": ${(e as Error).message}`);
          }
          if (process.stdout.isTTY) process.stderr.write(`CSR written to ${opts.out}\n`);
          return;
        }

        const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
        if (effectiveFmt === 'table') {
          printTable(data);
        } else {
          printJson(data);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
