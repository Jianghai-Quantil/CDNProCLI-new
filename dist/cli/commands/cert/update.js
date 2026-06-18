"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCertUpdateCommand = registerCertUpdateCommand;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const util_1 = require("../../util");
const loader_1 = require("../../../schema/loader");
const validate_1 = require("../../../schema/validate");
function readPemFile(filePath, label) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch (e) {
        throw new errors_2.CliError('ERROR', `Cannot read ${label} file "${filePath}": ${e.message}`);
    }
}
function encryptPrivateKey(pemContent, secretKey, dateStr) {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dateStr);
    const hexDigest = hmac.digest('hex');
    const ivHex = hexDigest.substring(0, 32);
    const keyHex = hexDigest.substring(32, 64);
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(keyHex, 'hex'), Buffer.from(ivHex, 'hex'));
    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(pemContent, 'utf8')),
        cipher.final(),
    ]);
    return encrypted.toString('base64');
}
function registerCertUpdateCommand(parent) {
    parent
        .command('update [id]')
        .description('Add a new certificate version (PATCH)')
        .option('--name <name>', 'Friendly name for the certificate record')
        // Upload mode
        .option('--cert <file>', 'PEM certificate file (upload mode)')
        .option('--key <file>', 'PEM private key file (upload mode)')
        .option('--ca <file>', 'PEM CA chain file (upload or CA-only mode)')
        // Self-signed mode
        .option('--self-signed <alg>', 'Algorithm: RSA2048 | ECC256 (server generates cert+key)')
        .option('--common-name <cn>', 'CN for the certificate (required with --self-signed)')
        .option('--san <hostname>', 'Subject Alternative Name; repeatable', (v, prev) => [...prev, v], [])
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
        .action(async (id, opts, cmd) => {
        try {
            const isUpload = !!(opts.cert || opts.key);
            const isSelfSigned = !!opts.selfSigned;
            const isCaOnly = !!opts.caOnly;
            const isFile = !!opts.file;
            // Handle --example (mode-aware)
            if (opts.example) {
                let exampleName;
                if (isSelfSigned) {
                    exampleName = 'Example of updating with a self signed certificate';
                }
                else {
                    exampleName = 'Example of updating who can use a certificate along with the certificate version.';
                }
                const example = (0, loader_1.getNamedSpecExample)('/cdn/certificates/{certificateID}', 'patch', exampleName);
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(id, 'id');
            const modeCount = [isUpload, isSelfSigned, isCaOnly, isFile].filter(Boolean).length;
            if (modeCount > 1) {
                process.stderr.write('Error: --cert/--key, --self-signed, --ca-only, and --file are mutually exclusive\n');
                process.exit(1);
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            let body = {};
            if (opts.name)
                body['name'] = opts.name;
            let dateOverride;
            if (isFile) {
                body = (0, util_1.readBodyFile)(opts.file);
                const validation = (0, validate_1.validateBody)('/cdn/certificates/{certificateID}', 'patch', body);
                if (!validation.valid)
                    (0, util_1.emitValidationError)(validation, 'cdnpro cert update --example', globals.output);
            }
            else if (isUpload) {
                if (!opts.cert)
                    throw new errors_2.CliError('VALIDATION', '--cert <file> is required in upload mode');
                if (!opts.key)
                    throw new errors_2.CliError('VALIDATION', '--key <file> is required in upload mode');
                const dateStr = new Date().toUTCString();
                dateOverride = dateStr;
                const certPem = readPemFile(opts.cert, 'certificate');
                const keyPem = readPemFile(opts.key, 'private key');
                const encryptedKey = encryptPrivateKey(keyPem, serverInfo.secretKey, dateStr);
                const newVersion = {
                    certificate: certPem,
                    privateKey: encryptedKey,
                };
                if (opts.ca)
                    newVersion['chainCert'] = readPemFile(opts.ca, 'CA chain');
                if (opts.comments)
                    newVersion['comments'] = opts.comments;
                body['newVersion'] = newVersion;
            }
            else if (isSelfSigned) {
                const alg = opts.selfSigned.toUpperCase();
                if (alg !== 'RSA2048' && alg !== 'ECC256') {
                    throw new errors_2.CliError('VALIDATION', '--self-signed must be RSA2048 or ECC256');
                }
                if (!opts.commonName)
                    throw new errors_2.CliError('VALIDATION', '--common-name is required with --self-signed');
                const identificationInfo = {
                    commonName: opts.commonName,
                    subjectAlternativeNames: opts.san ?? [],
                };
                if (opts.country)
                    identificationInfo['country'] = opts.country;
                if (opts.state)
                    identificationInfo['state'] = opts.state;
                if (opts.city)
                    identificationInfo['city'] = opts.city;
                if (opts.company)
                    identificationInfo['organization'] = opts.company;
                if (opts.department)
                    identificationInfo['department'] = opts.department;
                if (opts.email)
                    identificationInfo['email'] = opts.email;
                const newVersion = {
                    privateKey: alg,
                    certificate: 'Generate',
                    identificationInfo,
                };
                if (opts.comments)
                    newVersion['comments'] = opts.comments;
                body['newVersion'] = newVersion;
            }
            else if (isCaOnly) {
                if (!opts.ca)
                    throw new errors_2.CliError('VALIDATION', '--ca <file> is required with --ca-only');
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
            }
            else {
                process.stderr.write(`Certificate ${id} updated.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=update.js.map