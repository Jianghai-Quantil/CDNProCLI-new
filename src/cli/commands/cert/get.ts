import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printJson, printTable, OutputFormat } from '../../output';
import { handleError } from '../../errors';

interface RawResponseLike {
  obj: unknown;
  ctx: { _res: { headers: Record<string, string | string[] | undefined> } };
}

function isRawResponse(v: unknown): v is RawResponseLike {
  return typeof v === 'object' && v !== null && 'obj' in v && 'ctx' in v;
}

export function registerCertGetCommand(parent: Command): void {
  parent
    .command('get <id>')
    .description('Get a certificate by ID')
    .action(async (id: string, _opts: unknown, cmd: Command) => {
      try {
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);
        const fmt = globals.output as OutputFormat | undefined;

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          raw: true,
        };

        const rsp = await client.certificates.get(id, reqOptions);
        let data: unknown;
        const meta: Record<string, unknown> = {};

        if (isRawResponse(rsp)) {
          data = rsp.obj;
          const lm = rsp.ctx._res.headers['last-modified'];
          if (lm) meta.lastModified = Array.isArray(lm) ? lm[0] : lm;
        } else {
          data = rsp;
        }

        const effectiveFmt = fmt ?? 'json';
        if (effectiveFmt === 'table') {
          printTable(data);
        } else {
          printJson(data, Object.keys(meta).length > 0 ? meta : undefined);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
