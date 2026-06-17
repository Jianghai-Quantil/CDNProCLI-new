"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliError = exports.EXIT_CODES = void 0;
exports.handleError = handleError;
const chalk_1 = __importDefault(require("chalk"));
exports.EXIT_CODES = {
    SUCCESS: 0,
    ERROR: 1,
    AUTH_ERROR: 2,
    NOT_FOUND: 3,
    VALIDATION: 4,
    FORBIDDEN: 5,
    RATE_LIMITED: 6,
    SERVER_ERROR: 7,
    TIMEOUT: 8,
    CONFIG_ERROR: 9,
    PRECONDITION_FAILED: 10,
};
class CliError extends Error {
    code;
    details;
    silent;
    constructor(code, message, details, 
    /** When true, handleError skips printing (output was already emitted). */
    silent = false) {
        super(message);
        this.code = code;
        this.details = details;
        this.silent = silent;
        this.name = 'CliError';
    }
}
exports.CliError = CliError;
function isApiError(err) {
    return (err instanceof Error &&
        err.ctx !== undefined &&
        err.ctx?._res !== undefined);
}
function httpStatusToCode(status) {
    switch (true) {
        case status === 400: return 'VALIDATION';
        case status === 401: return 'AUTH_ERROR';
        case status === 403: return 'FORBIDDEN';
        case status === 404: return 'NOT_FOUND';
        case status === 412: return 'PRECONDITION_FAILED';
        case status === 429: return 'RATE_LIMITED';
        case (status ?? 0) >= 500: return 'SERVER_ERROR';
        default: return 'ERROR';
    }
}
function printError(payload) {
    if (process.stdout.isTTY) {
        process.stderr.write(chalk_1.default.red(`Error [${payload.code}]: ${payload.message}\n`));
        if (payload.body) {
            const bodyStr = typeof payload.body === 'string'
                ? payload.body
                : JSON.stringify(payload.body, null, 2);
            process.stderr.write(chalk_1.default.dim(bodyStr) + '\n');
        }
    }
    else {
        process.stdout.write(JSON.stringify({
            error: {
                code: payload.code,
                message: payload.message,
                ...(payload.httpStatus !== undefined ? { httpStatus: payload.httpStatus } : {}),
                ...(payload.body !== undefined ? { body: payload.body } : {}),
                ...(payload.details !== undefined ? { details: payload.details } : {}),
            },
        }) + '\n');
    }
}
function handleError(err) {
    if (err instanceof CliError) {
        if (!err.silent) {
            printError({ code: err.code, message: err.message, details: err.details });
        }
        process.exit(exports.EXIT_CODES[err.code]);
    }
    if (isApiError(err)) {
        const status = err.ctx?._res?.statusCode;
        const code = httpStatusToCode(status);
        printError({
            code,
            message: err.message,
            httpStatus: status,
            body: err.body,
        });
        process.exit(exports.EXIT_CODES[code]);
    }
    printError({ code: 'ERROR', message: String(err) });
    process.exit(exports.EXIT_CODES.ERROR);
}
//# sourceMappingURL=errors.js.map