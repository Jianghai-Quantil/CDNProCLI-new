import * as fs from 'fs';
import * as crypto from 'crypto';
import { Command } from 'commander';
import { resolveCredentials, GlobalOptions } from '../../config';
import { CDNProClient } from '../../../client/CDNProClient';
import { printCreateSuccess } from '../../output';
import { handleError } from '../../errors';
import { CliError } from '../../errors';
import { readBodyFile, emitValidationError, enrichWithLocationId } from '../../util';
import { getNamedSpecExample } from '../../../schema/loader';
import { validateBody } from '../../../schema/validate';

interface CreateOpts {
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
  const hexDigest = hmac.digest('hex'); // 64 hex chars

  const ivHex = hexDigest.substring(0, 32);   // 16 bytes IV
  const keyHex = hexDigest.substring(32, 64); // 16 bytes AES key

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

export function registerCertCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new certificate (upload, self-signed, CA-only, or --file)')
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
    .option('--ca-only', 'Register a CA certificate (caOnly: true)')
    // Full-body fallback
    .option('--file <path>', 'Full request body as JSON (- for stdin)')
    .option('--example', 'Print mode-aware example body and exit')
    .action(async (opts: CreateOpts, cmd: Command) => {
      try {
        const isUpload = !!(opts.cert || opts.key);
        const isSelfSigned = !!opts.selfSigned;
        const isCaOnly = !!opts.caOnly;
        const isFile = !!opts.file;

        // Handle --example (mode-aware)
        if (opts.example) {
          let exampleName: string;
          if (isSelfSigned && opts.selfSigned?.toUpperCase() === 'ECC256') {
            exampleName = 'Example of generating a self-signed ECC256 certificate';
          } else if (isSelfSigned) {
            exampleName = 'Example of generating a self-signed RSA2048 certificate';
          } else {
            exampleName = 'Example of uploading a certificate';
          }
          const example = getNamedSpecExample('/cdn/certificates', 'post', exampleName);
          process.stdout.write(JSON.stringify(example, null, 2) + '\n');
          return;
        }

        // Exactly one mode required
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

        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials(globals);
        const client = new CDNProClient(serverInfo);

        let body: unknown;

        if (isFile) {
          body = readBodyFile(opts.file!);
          const validation = validateBody('/cdn/certificates', 'post', body);
          if (!validation.valid) emitValidationError(validation, 'cdnpro cert create --example', globals.output);
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
            ...(globals.verbose ? { verbose: globals.verbose } : {}),
            dateOverride: dateStr,
          };

          const raw = await client.certificates.create(body, { ...reqOptions, raw: true, dateOverride: dateStr }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
          const data = enrichWithLocationId(raw);
          const id = data['id'] as string;

          printCreateSuccess('Certificate', 'certificateId', id, globals.output);
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
          ...(globals.verbose ? { verbose: globals.verbose } : {}),
        };

        const raw = await client.certificates.create(body, { ...reqOptions, raw: true }) as { obj: Record<string, unknown>; ctx: { _res: { headers: Record<string, string | string[] | undefined> } } };
        const data = enrichWithLocationId(raw);
        const id = data['id'] as string;

        printCreateSuccess('Certificate', 'certificateId', id, globals.output);
      } catch (err) {
        handleError(err);
      }
    });
}
