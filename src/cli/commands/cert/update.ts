import * as fs from 'fs';
import * as crypto from 'crypto';
import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, checkRequiredOption } from '../../util';
import { getNamedSpecExample } from '../../../schema/loader';
import { validateBody } from '../../../schema/validate';
import {
  OptionMapping,
  FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
  registerOptionsFromMapping,
  registerMappings,
} from '../../option-map';

export const CERT_UPDATE_OPTIONS: OptionMapping[] = [
  { flag: '--name <name>',       target: 'body', param: 'name',                        description: 'Friendly name for the certificate record' },
  // Upload mode
  { flag: '--cert <file>',       target: 'body', param: 'newVersion.certificate',       description: 'PEM certificate file (upload mode)' },
  { flag: '--key <file>',        target: 'body', param: 'newVersion.privateKey',        description: 'PEM private key file (upload mode)' },
  { flag: '--ca <file>',         target: 'body', param: 'newVersion.chainCert',         description: 'PEM CA chain file (upload or CA-only mode)' },
  // Self-signed mode
  { flag: '--self-signed <alg>', target: 'body', param: 'newVersion.privateKey',        description: 'Algorithm: RSA2048 | ECC256 (server generates cert+key)' },
  { flag: '--common-name <cn>',  target: 'body', param: 'newVersion.identificationInfo.commonName',          description: 'CN for the certificate (required with --self-signed)' },
  { flag: '--san <hostname>',    target: 'body', param: 'newVersion.identificationInfo.subjectAlternativeNames', description: 'Subject Alternative Name; repeatable', repeatable: true },
  { flag: '--country <CC>',      target: 'body', param: 'newVersion.identificationInfo.country',             description: '2-letter ISO-3166 country code' },
  { flag: '--state <state>',     target: 'body', param: 'newVersion.identificationInfo.state',               description: 'State or province' },
  { flag: '--city <city>',       target: 'body', param: 'newVersion.identificationInfo.city',                description: 'Locality' },
  { flag: '--company <org>',     target: 'body', param: 'newVersion.identificationInfo.organization',         description: 'Organization' },
  { flag: '--department <ou>',   target: 'body', param: 'newVersion.identificationInfo.department',           description: 'Organizational unit' },
  { flag: '--email <email>',     target: 'body', param: 'newVersion.identificationInfo.email',                description: 'Email address' },
  { flag: '--comments <text>',   target: 'body', param: 'newVersion.comments',               description: 'Version comments' },
  // CA-only mode
  { flag: '--ca-only',           target: 'body', param: 'caOnly',                            description: 'Update CA chain certificate only', boolean: true },
  // Full-body fallback + concurrency
  ...FILE_EXAMPLE,
  IF_UNMODIFIED_SINCE,
];

function readPemFile(filePath: string, label: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new CliError('ERROR', `Cannot read ${label} file "${filePath}": ${(e as Error).message}`);
  }
}

function encryptPrivateKey(pemContent: string, secretKey: string, dateStr: string): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dateStr);
  const hexDigest = hmac.digest('hex');

  const ivHex = hexDigest.substring(0, 32);
  const keyHex = hexDigest.substring(32, 64);

  const cipher = crypto.createCipheriv(
    'aes-128-cbc',
    Buffer.from(keyHex, 'hex'),
    Buffer.from(ivHex, 'hex'),
  );
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(pemContent, 'utf8')),
    cipher.final(),
  ]);
  return encrypted.toString('base64');
}

interface UpdateOpts {
  name?: string;
  cert?: string;
  key?: string;
  ca?: string;
  selfSigned?: string;
  commonName?: string;
  san?: string[];
  country?: string;
  state?: string;
  city?: string;
  company?: string;
  department?: string;
  email?: string;
  comments?: string;
  caOnly?: boolean;
  file?: string;
  ifUnmodifiedSince?: string;
  example?: boolean;
}

export function registerCertUpdateCommand(parent: Command): void {
  const cmd = parent
    .command('update [id]')
    .description('Add a new certificate version (PATCH)');

  registerOptionsFromMapping(cmd, CERT_UPDATE_OPTIONS);
  registerMappings('cert', 'update', CERT_UPDATE_OPTIONS);

  cmd.action(async (id: string | undefined, opts: UpdateOpts, cmdObj: Command) => {
    try {
      const isUpload = !!(opts.cert || opts.key);
      const isSelfSigned = !!opts.selfSigned;
      const isCaOnly = !!opts.caOnly;
      const isFile = !!opts.file;

      if (opts.example) {
        let exampleName: string;
        if (isSelfSigned && opts.selfSigned?.toUpperCase() === 'ECC256') {
          exampleName = 'Example of generating a self-signed ECC256 certificate';
        } else if (isSelfSigned) {
          exampleName = 'Example of generating a self-signed RSA2048 certificate';
        } else {
          exampleName = 'Example of uploading a certificate';
        }
        const example = getNamedSpecExample('/cdn/certificates/{certificateID}', 'patch', exampleName);
        process.stdout.write(JSON.stringify(example, null, 2) + '\n');
        return;
      }

      const modeCount = [isUpload, isSelfSigned, isCaOnly, isFile].filter(Boolean).length;
      if (modeCount === 0) {
        process.stderr.write(
          'Error: one of --cert/--key (upload), --self-signed (generated), --ca-only (CA chain), or --file (full body) is required\n',
        );
        process.exit(1);
      }
      if (modeCount > 1) {
        process.stderr.write('Error: --cert/--key, --self-signed, --ca-only, and --file are mutually exclusive\n');
        process.exit(1);
      }

      const globals = cmdObj.optsWithGlobals<GlobalOptions>();
      const serverInfo = await resolveCredentials(globals);
      const client = new CDNProClient(serverInfo);

      let body: unknown;

      if (isFile) {
        checkRequiredOption(opts.file, '--file <path>');
        body = readBodyFile(opts.file!);
        const validation = validateBody('/cdn/certificates/{certificateID}', 'patch', body);
        if (!validation.valid) emitValidationError(validation, 'cdnpro cert update --example', globals.output);
      } else if (isUpload) {
        if (!opts.cert) throw new CliError('VALIDATION', '--cert <file> is required in upload mode');
        if (!opts.key) throw new CliError('VALIDATION', '--key <file> is required in upload mode');

        const dateStr = new Date().toUTCString();
        const certPem = readPemFile(opts.cert, 'certificate');
        const keyPem = readPemFile(opts.key, 'private key');
        const encryptedKey = encryptPrivateKey(keyPem, serverInfo.secretKey, dateStr);

        const newVersion: Record<string, unknown> = {
          certificate: certPem,
          privateKey: encryptedKey,
        };
        if (opts.ca) newVersion['chainCert'] = readPemFile(opts.ca, 'CA chain');
        if (opts.comments) newVersion['comments'] = opts.comments;

        body = {
          ...(opts.name ? { name: opts.name } : {}),
          newVersion,
        };

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(opts.ifUnmodifiedSince ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          dateOverride: dateStr,
        };

        await client.certificates.update(id ?? '', body, { ...reqOptions, raw: true, dateOverride: dateStr });
        process.stderr.write(`Certificate version added for ${id}.\n`);
        return;
      } else if (isSelfSigned) {
        const alg = opts.selfSigned!.toUpperCase();
        if (alg !== 'RSA2048' && alg !== 'ECC256') {
          throw new CliError('VALIDATION', '--self-signed must be RSA2048 or ECC256');
        }
        if (!opts.commonName) throw new CliError('VALIDATION', '--common-name is required with --self-signed');

        const identificationInfo: Record<string, unknown> = {
          commonName: opts.commonName,
          subjectAlternativeNames: opts.san ?? [],
        };
        if (opts.country) identificationInfo['country'] = opts.country;
        if (opts.state) identificationInfo['state'] = opts.state;
        if (opts.city) identificationInfo['city'] = opts.city;
        if (opts.company) identificationInfo['organization'] = opts.company;
        if (opts.department) identificationInfo['department'] = opts.department;
        if (opts.email) identificationInfo['email'] = opts.email;

        const newVersion: Record<string, unknown> = {
          privateKey: alg,
          certificate: 'Generate',
          identificationInfo,
        };
        if (opts.comments) newVersion['comments'] = opts.comments;

        body = {
          ...(opts.name ? { name: opts.name } : {}),
          newVersion,
        };
      } else {
        // CA-only mode
        if (!opts.ca) throw new CliError('VALIDATION', '--ca <file> is required with --ca-only');
        const caPem = readPemFile(opts.ca, 'CA chain');
        body = {
          caOnly: true,
          ...(opts.name ? { name: opts.name } : {}),
          newVersion: { chainCert: caPem },
        };
      }

      const reqOptions = {
        ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
        ...(opts.ifUnmodifiedSince ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } } : {}),
        ...(globals.verbose ? { verbose: globals.verbose } : {}),
      };

      await client.certificates.update(id ?? '', body, { ...reqOptions, raw: true });
      process.stderr.write(`Certificate version added for ${id}.\n`);
    } catch (err) {
      handleError(err);
    }
  });
}
