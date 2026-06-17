import * as fs from 'fs';
import * as crypto from 'crypto';
import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile } from '../../util';
import { getNamedSpecExample } from '../../../schema/loader';
import { validateBody } from '../../../schema/validate';
import { emitValidationError } from '../../util';

interface UpdateOpts {
  name?: string;
  // Upload mode
  cert?: string;
  key?: string;
  ca?: string;
  // Self-signed mode
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
  // CA-only mode
  caOnly?: boolean;
  // Full-body fallback
  file?: string;
  // Concurrency control
  ifUnmodifiedSince?: string;
  // Example
  example?: boolean;
}

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

export function registerCertUpdateCommand(parent: Command): void {
  parent
    .command('update <id>')
    .description('Add a new certificate version (PATCH)')
    .option('--name <name>', 'Friendly name for the certificate record')
    // Upload mode
    .option('--cert <file>', 'PEM certificate file (upload mode)')
    .option('--key <file>', 'PEM private key file (upload mode)')
    .option('--ca <file>', 'PEM CA chain file (upload or CA-only mode)')
    // Self-signed mode
    .option('--self-signed <alg>', 'Algorithm: RSA2048 | ECC256 (server generates cert+key)')
    .option('--common-name <cn>', 'CN for the certificate (required with --self-signed)')
    .option('--san <hostname>', 'Subject Alternative Name; repeatable', (v: string, prev: string[]) => [...prev, v], [] as string[])
    .option('--country <CC>', '2-letter ISO-3166 country code')
    .option('--state <state>', 'State or province')
    .option('--city <city>', 'Locality')
    .option('--company <org>', 'Organization')
    .option('--department <ou>', 'Organizational unit')
    .option('--email <email>', 'Email address')
    .option('--comments <text>', 'Version comments')
    // CA-only mode
    .option('--ca-only', 'Update CA chain certificate only')
    // Full-body fallback
    .option('--file <path>', 'Full request body as JSON (- for stdin)')
    // Concurrency control
    .option('--if-unmodified-since <date>', 'If-Unmodified-Since header (RFC 1123); server returns 412 if modified since')
    .option('--example', 'Print mode-aware example body and exit')
    .action(async (id: string, opts: UpdateOpts, cmd: Command) => {
      try {
        const isUpload = !!(opts.cert || opts.key);
        const isSelfSigned = !!opts.selfSigned;
        const isCaOnly = !!opts.caOnly;
        const isFile = !!opts.file;

        // Handle --example (mode-aware)
        if (opts.example) {
          let exampleName: string;
          if (isSelfSigned) {
            exampleName = 'Example of updating with a self signed certificate';
          } else {
            exampleName = 'Example of updating who can use a certificate along with the certificate version.';
          }
          const example = getNamedSpecExample('/cdn/certificates/{certificateID}', 'patch', exampleName);
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        const modeCount = [isUpload, isSelfSigned, isCaOnly, isFile].filter(Boolean).length;
        if (modeCount > 1) {
          process.stderr.write('Error: --cert/--key, --self-signed, --ca-only, and --file are mutually exclusive\n');
          process.exit(1);
        }

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);

        let body: Record<string, unknown> = {};
        if (opts.name) body['name'] = opts.name;

        let dateOverride: string | undefined;

        if (isFile) {
          body = readBodyFile(opts.file!) as Record<string, unknown>;
          const validation = validateBody('/cdn/certificates/{certificateID}', 'patch', body);
          if (!validation.valid) emitValidationError(validation, 'cdnpro cert update --example', globals.output);
        } else if (isUpload) {
          if (!opts.cert) throw new CliError('VALIDATION', '--cert <file> is required in upload mode');
          if (!opts.key) throw new CliError('VALIDATION', '--key <file> is required in upload mode');

          const dateStr = new Date().toUTCString();
          dateOverride = dateStr;
          const certPem = readPemFile(opts.cert, 'certificate');
          const keyPem = readPemFile(opts.key, 'private key');
          const encryptedKey = encryptPrivateKey(keyPem, serverInfo.secretKey, dateStr);

          const newVersion: Record<string, unknown> = {
            certificate: certPem,
            privateKey: encryptedKey,
          };
          if (opts.ca) newVersion['chainCert'] = readPemFile(opts.ca, 'CA chain');
          if (opts.comments) newVersion['comments'] = opts.comments;
          body['newVersion'] = newVersion;
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
          body['newVersion'] = newVersion;
        } else if (isCaOnly) {
          if (!opts.ca) throw new CliError('VALIDATION', '--ca <file> is required with --ca-only');
          const caPem = readPemFile(opts.ca, 'CA chain');
          body['newVersion'] = { chainCert: caPem };
        }

        const reqOptions = {
          ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
          ...(opts.ifUnmodifiedSince ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } } : {}),
          ...(dateOverride ? { dateOverride } : {}),
        };

        await client.certificates.update(id, body, reqOptions);
        if (!process.stdout.isTTY || globals.output) {
          process.stdout.write(JSON.stringify({ success: true }) + '\n');
        } else {
          process.stderr.write(`Certificate ${id} updated.\n`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
