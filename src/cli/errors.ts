import chalk from 'chalk';

export const EXIT_CODES = {
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
} as const;

export type ExitCodeKey = keyof typeof EXIT_CODES;

export class CliError extends Error {
  constructor(
    public readonly code: ExitCodeKey,
    message: string,
    public readonly details?: unknown,
    /** When true, handleError skips printing (output was already emitted). */
    public readonly silent = false,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

interface ApiErrorLike extends Error {
  body?: unknown;
  ctx?: {
    _res?: { statusCode?: number };
  };
}

function isApiError(err: unknown): err is ApiErrorLike {
  return (
    err instanceof Error &&
    (err as ApiErrorLike).ctx !== undefined &&
    (err as ApiErrorLike).ctx?._res !== undefined
  );
}

function httpStatusToCode(status: number | undefined): ExitCodeKey {
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

function printError(payload: {
  code: ExitCodeKey;
  message: string;
  httpStatus?: number;
  body?: unknown;
  details?: unknown;
}): void {
  if (process.stdout.isTTY) {
    process.stderr.write(chalk.red(`Error [${payload.code}]: ${payload.message}\n`));
    if (payload.body) {
      const bodyStr = typeof payload.body === 'string'
        ? payload.body
        : JSON.stringify(payload.body, null, 2);
      process.stderr.write(chalk.dim(bodyStr) + '\n');
    }
  } else {
    process.stdout.write(
      JSON.stringify({
        error: {
          code: payload.code,
          message: payload.message,
          ...(payload.httpStatus !== undefined ? { httpStatus: payload.httpStatus } : {}),
          ...(payload.body !== undefined ? { body: payload.body } : {}),
          ...(payload.details !== undefined ? { details: payload.details } : {}),
        },
      }) + '\n',
    );
  }
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    if (!err.silent) {
      printError({ code: err.code, message: err.message, details: err.details });
    }
    process.exit(EXIT_CODES[err.code]);
  }

  if (isApiError(err)) {
    const status = err.ctx?._res?.statusCode;
    const code = httpStatusToCode(status);
    printError({
      code,
      message: err.message,
      httpStatus: status,
      body: (err as ApiErrorLike).body,
    });
    process.exit(EXIT_CODES[code]);
  }

  printError({ code: 'ERROR', message: String(err) });
  process.exit(EXIT_CODES.ERROR);
}
