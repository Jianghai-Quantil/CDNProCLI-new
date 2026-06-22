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
exports.CERT_CREATE_OPTIONS = void 0;
exports.registerCertCreateCommand = registerCertCreateCommand;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const util_1 = require("../../util");
const loader_1 = require("../../../schema/loader");
const validate_1 = require("../../../schema/validate");
const option_map_1 = require("../../option-map");
exports.CERT_CREATE_OPTIONS = [
    { flag: '--name <name>', target: 'body', param: 'name', description: 'Friendly name for the certificate record' },
    // Upload mode
    { flag: '--cert <file>', target: 'body', param: 'newVersion.certificate', description: 'PEM certificate file (upload mode)' },
    { flag: '--key <file>', target: 'body', param: 'newVersion.privateKey', description: 'PEM private key file (upload mode)' },
    { flag: '--ca <file>', target: 'body', param: 'newVersion.chainCert', description: 'PEM CA chain file (upload or CA-only mode)' },
    // Self-signed mode
    { flag: '--self-signed <alg>', target: 'cli-only', param: null, description: 'Algorithm: RSA2048 | ECC256 (server generates cert+key)' },
    { flag: '--common-name <cn>', target: 'body', param: 'newVersion.identificationInfo.commonName', description: 'CN for the certificate (required with --self-signed)' },
    { flag: '--san <hostname>', target: 'body', param: 'newVersion.identificationInfo.subjectAlternativeNames', description: 'Subject Alternative Name; repeatable', repeatable: true },
    { flag: '--country <CC>', target: 'body', param: 'newVersion.identificationInfo.country', description: '2-letter ISO-3166 country code' },
    { flag: '--state <state>', target: 'body', param: 'newVersion.identificationInfo.state', description: 'State or province' },
    { flag: '--city <city>', target: 'body', param: 'newVersion.identificationInfo.city', description: 'Locality' },
    { flag: '--company <org>', target: 'body', param: 'newVersion.identificationInfo.organization', description: 'Organization' },
    { flag: '--department <ou>', target: 'body', param: 'newVersion.identificationInfo.department', description: 'Organizational unit' },
    { flag: '--email <email>', target: 'body', param: 'newVersion.identificationInfo.email', description: 'Email address' },
    { flag: '--comments <text>', target: 'body', param: 'newVersion.comments', description: 'Version comments' },
    // CA-only mode
    { flag: '--ca-only', target: 'body', param: 'caOnly', description: 'Register a CA certificate', boolean: true },
    // Full-body fallback
    ...option_map_1.FILE_EXAMPLE,
];
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
function registerCertCreateCommand(parent) {
    const cmd = parent
        .command('create')
        .description('Create a new certificate (upload, self-signed, CA-only, or --file)');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.CERT_CREATE_OPTIONS);
    (0, option_map_1.registerMappings)('cert', 'create', exports.CERT_CREATE_OPTIONS);
    cmd.action(async (opts, cmdObj) => {
        try {
            const isUpload = !!(opts.cert || opts.key);
            const isSelfSigned = !!opts.selfSigned;
            const isCaOnly = !!opts.caOnly;
            const isFile = !!opts.file;
            if (opts.example) {
                let exampleName;
                if (isSelfSigned && opts.selfSigned?.toUpperCase() === 'ECC256') {
                    exampleName = 'Example of generating a self-signed ECC256 certificate';
                }
                else if (isSelfSigned) {
                    exampleName = 'Example of generating a self-signed RSA2048 certificate';
                }
                else {
                    exampleName = 'Example of uploading a certificate';
                }
                const example = (0, loader_1.getNamedSpecExample)('/cdn/certificates', 'post', exampleName);
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            const modeCount = [isUpload, isSelfSigned, isCaOnly, isFile].filter(Boolean).length;
            if (modeCount === 0) {
                process.stderr.write('Error: one of --cert/--key (upload), --self-signed (generated), --ca-only (CA chain), or --file (full body) is required\n');
                process.exit(1);
            }
            if (modeCount > 1) {
                process.stderr.write('Error: --cert/--key, --self-signed, --ca-only, and --file are mutually exclusive\n');
                process.exit(1);
            }
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            let body;
            if (isFile) {
                body = (0, util_1.readBodyFile)(opts.file);
                const validation = (0, validate_1.validateBody)('/cdn/certificates', 'post', body);
                if (!validation.valid)
                    (0, util_1.emitValidationError)(validation, 'cdnpro cert create --example', globals.output);
            }
            else if (isUpload) {
                if (!opts.cert)
                    throw new errors_2.CliError('VALIDATION', '--cert <file> is required in upload mode');
                if (!opts.key)
                    throw new errors_2.CliError('VALIDATION', '--key <file> is required in upload mode');
                const dateStr = new Date().toUTCString();
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
                body = {
                    ...(opts.name ? { name: opts.name } : {}),
                    newVersion,
                };
                const reqOptions = {
                    ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                    ...(globals.verbose ? { verbose: globals.verbose } : {}),
                    dateOverride: dateStr,
                };
                const raw = await client.certificates.create(body, { ...reqOptions, raw: true, dateOverride: dateStr });
                const data = (0, util_1.enrichWithLocationId)(raw);
                const id = data['id'];
                (0, output_1.printCreateSuccess)('Certificate', 'certificateId', id, globals.output);
                return;
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
                body = {
                    ...(opts.name ? { name: opts.name } : {}),
                    newVersion,
                };
            }
            else {
                // CA-only mode
                if (!opts.ca)
                    throw new errors_2.CliError('VALIDATION', '--ca <file> is required with --ca-only');
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
            const raw = await client.certificates.create(body, { ...reqOptions, raw: true });
            const data = (0, util_1.enrichWithLocationId)(raw);
            const id = data['id'];
            (0, output_1.printCreateSuccess)('Certificate', 'certificateId', id, globals.output);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map