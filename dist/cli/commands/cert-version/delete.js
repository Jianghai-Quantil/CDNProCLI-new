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
exports.CERT_VERSION_DELETE_OPTIONS = void 0;
exports.registerCertVersionDeleteCommand = registerCertVersionDeleteCommand;
const readline = __importStar(require("readline"));
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const errors_1 = require("../../errors");
const option_map_1 = require("../../option-map");
exports.CERT_VERSION_DELETE_OPTIONS = [option_map_1.CONFIRM];
function registerCertVersionDeleteCommand(parent) {
    (0, option_map_1.registerMappings)('cert-version', 'delete', exports.CERT_VERSION_DELETE_OPTIONS);
    const cmd = parent
        .command('delete <certificateId> <version>')
        .description('Delete a specific certificate version');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.CERT_VERSION_DELETE_OPTIONS);
    cmd.action(async (certificateId, version, opts, cmdObj) => {
        try {
            if (!opts.confirm && process.stdout.isTTY) {
                const answer = await new Promise((resolve) => {
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl.question(`Delete certificate "${certificateId}" version ${version}? [y/N] `, (ans) => { rl.close(); resolve(ans); });
                });
                if (answer.toLowerCase() !== 'y') {
                    process.stderr.write('Aborted.\n');
                    process.exit(0);
                }
            }
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            await client.certificates.deleteVersion(certificateId, version, reqOptions);
            if (!process.stdout.isTTY || globals.output) {
                process.stdout.write(JSON.stringify({ success: true, certificateId, version }) + '\n');
            }
            else {
                process.stderr.write(`Certificate ${certificateId} version ${version} deleted.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=delete.js.map