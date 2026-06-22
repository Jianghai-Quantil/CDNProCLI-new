import * as fs from 'fs';
import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import {
  OptionMapping,
  registerOptionsFromMapping,
  buildRequestFromMapping,
  registerMappings,
} from '../../option-map';

export const CERT_DOWNLOAD_CSR_OPTIONS: OptionMapping[] = [
  { flag: '--dcv <provider>', target: 'query', param: 'dcv', description: 'DCV provider (e.g. sectigo)' },
  { flag: '--out <file>',     target: 'cli-only', param: null, description: 'Write CSR to file instead of stdout' },
];

export function registerCertDownloadCsrCommand(parent: Command): void {
  const cmd = parent
    .command('download-csr <id>')
    .description('Download the CSR for a certificate');

  registerOptionsFromMapping(cmd, CERT_DOWNLOAD_CSR_OPTIONS);
  registerMappings('cert', 'download-csr', CERT_DOWNLOAD_CSR_OPTIONS);

  cmd.action(async (id: string, opts: Record<string, unknown>, cmdObj: Command) => {
    try {
      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);
      const fmt = globals.output as OutputFormat | undefined;

      const { query } = buildRequestFromMapping(opts, CERT_DOWNLOAD_CSR_OPTIONS);

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      const data = await client.certificates.downloadCSR(id, query, reqOptions);

      if (opts.out) {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        try {
          fs.writeFileSync(opts.out as string, content);
        } catch (e) {
          throw new CliError('ERROR', `Cannot write to "${opts.out}": ${(e as Error).message}`);
        }
        if (process.stdout.isTTY) process.stderr.write(`CSR written to ${opts.out}\n`);
        return;
      }

      printResult(data, fmt);
    } catch (err) {
      handleError(err);
    }
  });
}
