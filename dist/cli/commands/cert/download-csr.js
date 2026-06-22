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
exports.CERT_DOWNLOAD_CSR_OPTIONS = void 0;
exports.registerCertDownloadCsrCommand = registerCertDownloadCsrCommand;
const fs = __importStar(require("fs"));
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const errors_2 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.CERT_DOWNLOAD_CSR_OPTIONS = [
    { flag: '--dcv <provider>', target: 'query', param: 'dcv', description: 'DCV provider (e.g. sectigo)' },
    { flag: '--out <file>', target: 'cli-only', param: null, description: 'Write CSR to file instead of stdout' },
];
function registerCertDownloadCsrCommand(parent) {
    const cmd = parent
        .command('download-csr <id>')
        .description('Download the CSR for a certificate');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.CERT_DOWNLOAD_CSR_OPTIONS);
    (0, option_map_1.registerMappings)('cert', 'download-csr', exports.CERT_DOWNLOAD_CSR_OPTIONS);
    cmd.action(async (id, opts, cmdObj) => {
        try {
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const { query } = (0, option_map_1.buildRequestFromMapping)(opts, exports.CERT_DOWNLOAD_CSR_OPTIONS);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.certificates.downloadCSR(id, query, reqOptions);
            if (opts.out) {
                const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                try {
                    fs.writeFileSync(opts.out, content);
                }
                catch (e) {
                    throw new errors_2.CliError('ERROR', `Cannot write to "${opts.out}": ${e.message}`);
                }
                if (process.stdout.isTTY)
                    process.stderr.write(`CSR written to ${opts.out}\n`);
                return;
            }
            (0, output_1.printResult)(data, fmt);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=download-csr.js.map