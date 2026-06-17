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
exports.readBodyFile = readBodyFile;
exports.emitValidationError = emitValidationError;
const fs = __importStar(require("fs"));
const errors_1 = require("./errors");
/**
 * Read a JSON body from a file path or stdin ("-").
 * Throws CliError if the path is unreadable or the content is not valid JSON.
 */
function readBodyFile(filePath) {
    let raw;
    try {
        raw = filePath === '-'
            ? fs.readFileSync(process.stdin.fd, 'utf8')
            : fs.readFileSync(filePath, 'utf8');
    }
    catch (e) {
        throw new errors_1.CliError('ERROR', `Cannot read "${filePath}": ${e.message}`);
    }
    try {
        return JSON.parse(raw);
    }
    catch (e) {
        throw new errors_1.CliError('VALIDATION', `"${filePath}" is not valid JSON: ${e.message}`);
    }
}
/**
 * Formats and emits a validation failure, then throws a CliError (exit code 4).
 *
 * In table/TTY mode: human-readable error lines on stderr.
 * In JSON mode: machine-readable envelope on stdout with the full schema
 *   so an AI agent can self-correct without a second round-trip.
 *
 * @param result   - The ValidationResult from validateBody()
 * @param hint     - The full `cdnpro <resource> <operation> --example` command string for the hint message
 * @param output   - The --output flag value (undefined = auto-detect from isTTY)
 */
function emitValidationError(result, hint, output) {
    const errors = result.errors;
    const isHuman = output == null ? process.stdout.isTTY : output === 'table';
    if (isHuman) {
        process.stderr.write('Error: Invalid request body\n');
        for (const e of errors) {
            process.stderr.write(`  - ${e.instancePath || 'body'}: ${e.message}\n`);
        }
        process.stderr.write(`\nTip: run \`${hint}\` for a valid template\n`);
    }
    else {
        const count = errors.length;
        const envelope = {
            error: {
                code: 'VALIDATION',
                message: `Request body failed schema validation (${count} error${count !== 1 ? 's' : ''})`,
                validationErrors: errors.map(e => ({
                    path: e.instancePath || '',
                    message: e.message ?? '',
                    keyword: e.keyword,
                    params: e.params,
                })),
                schema: result.schema,
                hint: `Run \`${hint}\` to see a valid body template`,
            },
        };
        process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
    }
    throw new errors_1.CliError('VALIDATION', 'Invalid request body', undefined, true);
}
//# sourceMappingURL=util.js.map