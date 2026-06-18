import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printResult, OutputFormat } from '../../output';
import { handleError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from '../../util';
import { getExampleBody } from '../../../schema/synthesize';
import { validateBody } from '../../../schema/validate';

interface LookupOpts {
  file?: string;
  example?: boolean;
}

export function registerIpDetailsCommands(parent: Command): void {
  const ipCmd = parent
    .command('ip-details')
    .description('Look up details for IP addresses');

  ipCmd
    .command('lookup')
    .description('Look up details for a list of IP addresses (POST /ngadmin/ipDetails)')
    .option('--file <path>', 'Request body as JSON (- for stdin)')
    .option('--example', 'Print an example request body and exit')
    .action(async (opts: LookupOpts, cmd: Command) => {
      try {
        if (opts.example) {
          const example = getExampleBody('/ngadmin/ipDetails', 'post');
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        checkRequiredOption(opts.file, '--file <path>');

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const body = readBodyFile(opts.file);
        const validation = validateBody('/ngadmin/ipDetails', 'post', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro schema ip-details lookup', globals.output);

        const reqOptions = {
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const data = await client.geo.ipDetails(body, reqOptions);
        printResult(data, fmt);
      } catch (err) {
        handleError(err);
      }
    });
}
