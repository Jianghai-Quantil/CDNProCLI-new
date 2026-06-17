# CDNProCLI Rebuild: Implementation Plan

> Generated: 2026-06-15  
> Scope: Rebuild the CLI tool to serve both human operators and AI agents.  
> Out of scope: MCP server (handled in a separate project that will import `CDNProClient`).

---

## Guiding Principles

- **Keep `CDNProClient.js`** — the resource layer is solid. Migrate it to TypeScript; do not rewrite the logic.
- **New code only for the CLI surface** — `ApiCore`, auth, and resource classes stay; the CLI layer is net-new.
- **No breaking changes to the library API** — TypeScript types are additive. The MCP server project can import the built output unchanged.
- **Machine-readable by default when not a TTY** — every command auto-selects JSON output when stdout is not a terminal, so AI agents and shell pipelines work without flags.

---

## Target Repository Layout

```
CDNProCLI/
├── src/
│   ├── client/                        # Migrated from cdn/js/ (TypeScript)
│   │   ├── ApiCore.ts
│   │   ├── CDNProClient.ts
│   │   └── resources/
│   │       ├── Properties.ts
│   │       ├── Certificates.ts
│   │       ├── DeploymentTasks.ts
│   │       ├── Purges.ts
│   │       ├── Report.ts
│   │       ├── Webhooks.ts
│   │       ├── Secrets.ts
│   │       ├── EdgeHostnames.ts
│   │       ├── ServiceQuotas.ts
│   │       ├── SystemConfigs.ts
│   │       ├── Customers.ts
│   │       ├── Validations.ts
│   │       ├── Geo.ts
│   │       └── ResourceSummary.ts
│   ├── cli/
│   │   ├── main.ts                    # Entry point / root command
│   │   ├── config.ts                  # Profile & credential management
│   │   ├── keychain.ts                # OS keychain wrapper (keytar)
│   │   ├── output.ts                  # Formatter (table / json / jsonl)
│   │   ├── errors.ts                  # CliError class + exit codes
│   │   ├── wait.ts                    # Async operation poller
│   │   └── commands/
│   │       ├── auth.ts
│   │       ├── schema.ts              # cdnpro schema <resource> <operation>
│   │       ├── property/
│   │       │   ├── index.ts
│   │       │   ├── list.ts
│   │       │   ├── get.ts
│   │       │   ├── create.ts          # supports --example
│   │       │   ├── update.ts          # supports --example
│   │       │   ├── delete.ts
│   │       │   └── version/
│   │       │       ├── index.ts
│   │       │       ├── list.ts
│   │       │       ├── get.ts
│   │       │       ├── create.ts      # supports --example
│   │       │       ├── update.ts      # supports --example
│   │       │       └── delete.ts
│   │       ├── cert/
│   │       │   ├── index.ts
│   │       │   ├── list.ts
│   │       │   ├── get.ts
│   │       │   ├── create.ts          # supports --example
│   │       │   ├── update.ts
│   │       │   └── delete.ts
│   │       ├── deploy/
│   │       │   ├── index.ts
│   │       │   ├── list.ts
│   │       │   ├── get.ts
│   │       │   └── create.ts          # supports --wait, --example
│   │       ├── hostname/
│   │       │   ├── index.ts
│   │       │   ├── list.ts
│   │       │   └── get.ts
│   │       ├── hostname-history/
│   │       │   ├── index.ts
│   │       │   ├── list.ts
│   │       │   └── get.ts
│   │       ├── purge/
│   │       │   ├── index.ts
│   │       │   ├── create.ts          # supports --wait, --example
│   │       │   ├── list.ts
│   │       │   ├── get.ts
│   │       │   ├── summary.ts
│   │       │   └── tokens.ts
│   │       ├── prefetch/
│   │       │   ├── index.ts
│   │       │   ├── create.ts          # supports --wait
│   │       │   ├── list.ts
│   │       │   ├── get.ts
│   │       │   └── tokens.ts
│   │       └── report/
│   │           ├── index.ts
│   │           ├── time-series.ts     # shared builder for all time-series report commands
│   │           └── summary.ts         # shared builder for all summary report commands
│   ├── schema/
│   │   ├── loader.ts                  # Loads + caches openapi.json at runtime
│   │   ├── query.ts                   # Resolves CLI resource+operation → OpenAPI path+method
│   │   ├── synthesize.ts              # Synthesizes example bodies from JSON Schema
│   │   └── validate.ts                # Wraps ajv for request body validation
│   └── types/
│       └── api.ts                     # Generated — do not edit by hand
├── dist/                              # Compiled output (gitignored)
├── cdn/                               # Original bash + JS code (kept for backward compat)
├── openapi.json
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

---

## Phase 1 — TypeScript Setup & Library Migration

### 1.1 `package.json`

```json
{
  "name": "cdnpro-cli",
  "version": "2.0.0",
  "bin": { "cdnpro": "./dist/cli/main.js" },
  "main": "./dist/client/CDNProClient.js",
  "types": "./dist/client/CDNProClient.d.ts",
  "scripts": {
    "build": "npm run generate:types && tsc",
    "generate:types": "openapi-typescript openapi.json -o src/types/api.ts",
    "dev": "tsx src/cli/main.ts",
    "test": "node --test dist/test/**/*.js"
  },
  "dependencies": {
    "ajv": "^8.17.0",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.3",
    "commander": "^12.0.0",
    "conf": "^9.0.0",
    "diff": "^8.0.3",
    "keytar": "^7.9.0",
    "node-forge": "^1.4.0",
    "ora": "^5.4.1",
    "xml2js": "^0.6.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "openapi-typescript": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0"
  }
}
```

Dependency rationale:
- `commander` — minimal CLI framework, no magic, full control over command structure
- `ajv` — JSON Schema validation for request bodies (Phase 5)
- `chalk` — terminal colors (error red, success green, table headers)
- `cli-table3` — ASCII table output for human-readable mode
- `ora` — spinner for `--wait` polling
- `conf` — XDG-compliant config file at `~/.config/cdnpro/`

> **Note on package versions:** `chalk@5`, `ora@6+`, and `conf@10+` are ESM-only and cannot be `require()`'d from CommonJS output. The versions above (`chalk@4`, `ora@5`, `conf@9`) are the last major releases that ship CommonJS builds, keeping them compatible with the `"module": "CommonJS"` tsconfig setting (see §1.2).

### 1.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "cdn"]
}
```

`"module": "CommonJS"` keeps the compiled library compatible with the MCP server project and other Node consumers without ESM interop overhead. This constrains several dependencies to their last CJS-compatible major release; see the version notes in §1.1.

### 1.3 Migrating `ApiCore.js`

Direct translation — no logic changes. Add types:

```typescript
// src/client/ApiCore.ts

export interface ServerInfo {
  host: string;
  user: string;
  secretKey: string;
  family?: 4 | 6;
  scheme?: 'http' | 'https';
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | string[]>;
  body?: unknown;
  headers?: Record<string, string>;
  onBehalfOf?: string | number;
  reportRange?: string;
  noCache?: boolean;
  abortOnError?: boolean;
  verbose?: number;
  debug?: unknown;
  raw?: boolean;
  newConnection?: boolean;
}

export interface ResponseContext {
  options: Record<string, unknown>;
  times: {
    start: number;
    socket?: number;
    dns?: number;
    connect?: number;
    tls?: number;
    header?: number;
    finish?: number;
  };
  bodyBytes: { raw: number; decoded: number };
  remoteAddress?: string;
  _res: import('http').IncomingMessage;
}

export interface RawResponse<T = unknown> {
  obj: T;
  ctx: ResponseContext;
}
```

Each resource class gets return types derived from `src/types/api.ts` (see Phase 5.1).

### 1.4 What to keep from `cdn/`

| File | Action |
|---|---|
| `cdn/js/client/ApiCore.js` | Migrate → `src/client/ApiCore.ts` |
| `cdn/js/client/*.js` (resources) | Migrate → `src/client/resources/*.ts` |
| `cdn/js/CDNProClient.js` | Migrate → `src/client/CDNProClient.ts` |
| `cdn/bash/build-cert-body.sh` | Logic absorbed into `cdnpro cert create` |
| `cdn/bash/cdnapi.sh` | Keep unchanged for backward compatibility |

---

## Phase 2 — Config & Auth System

### 2.1 Config file structure

Secret keys are stored in the OS keychain via `keytar` (macOS Keychain, Windows Credential Manager, Linux Secret Service). Non-sensitive fields (host, user) are stored in the conf JSON file. If the keychain is unavailable (headless server, CI), a one-time warning is shown and the secret falls back to the conf file.

The `keychain.ts` module wraps `keytar` with graceful fallback (lazy-loads the native addon so failures degrade rather than crash at startup). Keychain namespace: service `cdnpro`, account `cdnpro:<profileName>`.

```typescript
// src/cli/config.ts

/** Stored in conf JSON — never contains the secret key. */
interface StoredProfile {
  host: string;
  user: string;
  secretKey?: string;  // only present as fallback when keychain is unavailable
}

/** Fully-resolved in-memory shape — never persisted. */
interface Profile {
  host: string;
  user: string;
  secretKey: string;
}

interface CdnProConfig {
  defaultProfile: string;
  profiles: Record<string, StoredProfile>;
}
```

### 2.2 Credential resolution order

Resolved highest-priority first:

1. CLI flags: `--host`, `--user`, `--secret-key`
2. Environment variables: `CDNPRO_HOST`, `CDNPRO_USER`, `CDNPRO_SECRETKEY`
3. Profile via flag: `--profile staging`
4. Profile via env: `CDNPRO_PROFILE=staging`
5. Default profile in `~/.config/cdnpro/config.json`
6. Error: "No credentials found. Run `cdnpro auth login`."

```typescript
export async function resolveCredentials(globalOpts: GlobalOptions): Promise<ServerInfo> {
  if (globalOpts.host && globalOpts.user && globalOpts.secretKey)
    return { host: globalOpts.host, user: globalOpts.user, secretKey: globalOpts.secretKey };

  if (process.env.CDNPRO_HOST && process.env.CDNPRO_USER && process.env.CDNPRO_SECRETKEY)
    return { host: process.env.CDNPRO_HOST, user: process.env.CDNPRO_USER, secretKey: process.env.CDNPRO_SECRETKEY };

  const profileName = globalOpts.profile ?? process.env.CDNPRO_PROFILE ?? config.get('defaultProfile');
  const profile = config.get(`profiles.${profileName}`);
  if (profile) {
    const secretKey = (await getSecret(profileName)) ?? profile.secretKey;
    if (!secretKey) throw new CliError('CONFIG_ERROR', `Keychain entry missing for profile "${profileName}". Run \`cdnpro auth login -p ${profileName}\` to re-save credentials.`);
    return { host: profile.host, user: profile.user, secretKey };
  }

  throw new CliError('CONFIG_ERROR', 'No credentials found. Run `cdnpro auth login`.');
}
```

### 2.3 `auth` commands

```
cdnpro auth login [--profile <name>]    Interactive prompt: host, user, secretKey (hidden input). Secret stored in OS keychain; host/user in config file.
cdnpro auth logout [--profile <name>]   Remove profile from config and keychain
cdnpro auth list                         List all profiles; masks secretKey as **** and shows storage location (keychain / config file)
cdnpro auth switch <profile>             Set default profile
cdnpro auth status                       Test credentials with a lightweight GET /cdn/properties?limit=1
```

---

## Phase 3 — Output Formatting & Error Handling

### 3.1 Output module

```typescript
// src/cli/output.ts

export type OutputFormat = 'table' | 'json' | 'jsonl';

export function print(data: unknown, format: OutputFormat | undefined, columns?: string[]): void {
  // Auto-detect: table for interactive TTY, json when piped
  const fmt = format ?? (process.stdout.isTTY ? 'table' : 'json');

  switch (fmt) {
    case 'json':  return printJson(data);
    case 'jsonl': return printJsonl(data);
    case 'table': return printTable(data, columns);
  }
}
```

JSON output wraps all responses in an envelope:

```json
{
  "data": [ ... ],
  "meta": { "total": 847, "limit": 10, "offset": 0 }
}
```

JSONL emits one object per line (for `--all` pagination and streaming):

```
{"propertyId":"abc","name":"site-a","status":"active"}
{"propertyId":"def","name":"site-b","status":"inactive"}
```

### 3.2 Global options (inherited by all commands)

```
--profile <name>        Use named credential profile
--host <host>           Override API host
--user <user>           Override username
--secret-key <key>      Override secret key
--output <format>       table | json | jsonl  [default: table if TTY, json if piped]
--no-color              Disable color output
-v, --verbose           Increase verbosity (repeat for more: -vv)
--on-behalf-of <id>     On-Behalf-Of customer ID header
```

`On-Behalf-Of` is global because it appears on essentially every endpoint. It is a credential-scoping concern, not an operation-specific one.

**Headers that are NOT global** and must be declared per-command:

| Header | CLI flag | Applies to |
|---|---|---|
| `Report-Range` | `--report-range <scope>` | All `list` subcommands; all `report` subcommands |
| `If-Unmodified-Since` | `--if-unmodified-since <date>` | All update/patch commands for mutable resources |
| `Check-Certificate` | `--skip-certificate-check` | `deploy create` only |
| `Check-Client-CA-Certificate` | `--skip-client-ca-certificate-check` | `deploy create` only |
| `Check-Origin-Auth-Certificate` | `--skip-origin-auth-certificate-check` | `deploy create` only |
| `Check-Usage` | `--skip-usage-check` | `deploy create`, `edge-hostname delete` |

`Report-Range` is on 30+ operations (list and report operations; never on create/update/delete), so placing it on the root command would silently accept it on operations where the server ignores it — misleading to agents reading `--help`. It is declared on each command that supports it.

`If-Unmodified-Since` is the server's optimistic concurrency control mechanism. The server returns a `Last-Modified` response header on GET calls for mutable resources (properties, property versions, certificates, edge hostnames, secrets, webhooks, annotations, log configs, service quotas). Passing this timestamp back via `--if-unmodified-since` on a subsequent update guards against overwriting a change made by another client. The server responds with HTTP 412 (Precondition Failed) if the resource was modified after the given timestamp. The CLI surfaces `Last-Modified` in JSON output under `meta.lastModified` so agents can capture it for subsequent update calls.

The three `Check-*` headers on `deploy create` are safety-bypass flags that suppress independent server-side validation checks. Each targets a different check: TLS certificate validity (`Check-Certificate`), CA certificate for client verification (`Check-Client-CA-Certificate`), and certificate used for origin authentication (`Check-Origin-Auth-Certificate`). All headers are formally documented in `openapi.json`, which `cdnpro schema` reads as the single authoritative source (see Section 5.3).

### 3.3 Exit codes

```
0   Success
1   Generic / unknown error
2   Auth error (missing credentials, HMAC rejected)
3   Not found (HTTP 404)
4   Validation error (invalid request body — local or HTTP 400)
5   Permission denied (HTTP 403)
6   Rate limited (HTTP 429)
7   Server error (HTTP 5xx)
8   Timeout (request or --wait deadline)
9   Config error (malformed config file, missing profile)
10  Precondition failed (HTTP 412 — If-Unmodified-Since violated)
```

```typescript
// src/cli/errors.ts

export const EXIT_CODES = {
  SUCCESS: 0, ERROR: 1, AUTH_ERROR: 2, NOT_FOUND: 3,
  VALIDATION: 4, FORBIDDEN: 5, RATE_LIMITED: 6,
  SERVER_ERROR: 7, TIMEOUT: 8, CONFIG_ERROR: 9,
  PRECONDITION_FAILED: 10,
} as const;

export class CliError extends Error {
  constructor(
    public readonly code: keyof typeof EXIT_CODES,
    message: string,
    public readonly details?: unknown,
  ) { super(message); }
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    printError({ code: err.code, message: err.message, details: err.details });
    process.exit(EXIT_CODES[err.code]);
  }
  if (isApiError(err)) {
    const code = httpStatusToCode(err.ctx._res.statusCode);
    printError({ code, message: err.message, httpStatus: err.ctx._res.statusCode, body: err.body });
    process.exit(EXIT_CODES[code]);
  }
  printError({ code: 'ERROR', message: String(err) });
  process.exit(EXIT_CODES.ERROR);
}

function httpStatusToCode(status: number): keyof typeof EXIT_CODES {
  switch (true) {
    case status === 401:  return 'AUTH_ERROR';
    case status === 403:  return 'FORBIDDEN';
    case status === 404:  return 'NOT_FOUND';
    case status === 412:  return 'PRECONDITION_FAILED';
    case status === 429:  return 'RATE_LIMITED';
    case status >= 500:   return 'SERVER_ERROR';
    default:              return 'ERROR';
  }
}
```

---

## Phase 4 — Core Commands

Each command follows the same pattern:
1. Resolve credentials via `resolveCredentials()`
2. Instantiate `CDNProClient`
3. Call the resource method
4. Pass result through `print()`

### 4.1 `property` commands

```
cdnpro property list
  [--search <term>]                            Keyword search
  [--target staging|production]                Filter by deployment target
  [--has-config <value>]                       Filter by configuration status
  [--sort-by creationTime|lastUpdateTime]
  [--sort-order asc|desc]
  [--limit <n>]                                Page size [default: 10]
  [--offset <n>]
  [--all]                                      Auto-paginate; implies --output jsonl
  [--report-range <scope>]                     self-only | self+children | children-only  [default: self-only]

cdnpro property get <id>

cdnpro property create
  --file <path>                    JSON body file (use - for stdin)
  [--example]                      Print example body and exit; no API call

cdnpro property update <id>
  --file <path>
  [--if-unmodified-since <date>]   If-Unmodified-Since header (RFC 1123); server returns 412 if modified since
  [--example]

cdnpro property delete <id>
  [--confirm]                      Skip confirmation prompt

cdnpro property-version list <id>
  [--search <term>]                            Match against version description
  [--sort-by version|lastUpdateTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
cdnpro property-version get <id> <version>
cdnpro property-version create <id> --file <path> [--example]
cdnpro property-version update <id> <version> --file <path>
  [--if-unmodified-since <date>]   If-Unmodified-Since header (RFC 1123)
  [--example]
cdnpro property-version delete <id> <version>
```

`--file -` reads from stdin, enabling pipe chaining:

```bash
cdnpro property get abc123 \
  | jq '.data.description = "updated"' \
  | cdnpro property update abc123 --file -
```

`--all` auto-paginates by looping with increasing `offset` until the returned count is less than `limit`. Emits JSONL to avoid buffering large result sets in memory.

When a GET command returns a resource that supports `If-Unmodified-Since`, the `Last-Modified` timestamp from the server response is included in the JSON output envelope under `meta.lastModified`. This allows an agent to capture it in one step and pass it to a subsequent update:

```bash
LAST_MOD=$(cdnpro property get abc123 --output json | jq -r '.meta.lastModified')
cdnpro property update abc123 --file patch.json --if-unmodified-since "$LAST_MOD"
```

### 4.2 `cert` commands

```
cdnpro cert list
  [--search <term>]
  [--target all|staging|production]            Filter by deployment status
  [--ca-only]                                  Show only CA certificates
  [--auto-renew LE|Off]                        Filter by auto-renewal setting
  [--sort-by creationTime|lastUpdateTime|expirationTime|productionExpirationTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro cert get <id>

cdnpro cert create
  [--name <name>]                              Friendly name for the certificate record

  # Mode 1 — Upload: submit existing PEM files (private key encrypted client-side before sending)
  --cert <file>                                PEM certificate file
  --key <file>                                 PEM private key file
  [--ca <file>]                                PEM CA chain file

  # Mode 2 — Self-signed: server generates the certificate and private key
  --self-signed RSA2048|ECC256                 Algorithm; produces certificate:"Generate" + privateKey:<alg>
  --common-name <cn>                           CN for the certificate (required with --self-signed)
  --san <hostname>                             Subject Alternative Name; repeatable
  [--country <CC>]                             2-letter ISO-3166 country code
  [--state <state>]                            State or province
  [--city <city>]                              Locality
  [--company <org>]                            Organization
  [--department <ou>]                          Organizational unit
  [--email <email>]                            Email address
  [--comments <text>]                          Version comments

  # Mode 3 — CA-only: register a CA certificate (no leaf cert or private key)
  --ca-only                                    Set caOnly: true in request body
  --ca <file>                                  PEM CA chain file (required with --ca-only)

  # Full-body fallback (mutually exclusive with all mode flags)
  [--file <path>]                              Full request body as JSON (- for stdin)

  [--example]                                  Print mode-aware example body and exit

cdnpro cert update <id>
  # Same three modes as cert create — adds a new version (newVersion field in PATCH body)

  # Upload mode
  --cert <file>
  --key <file>
  [--ca <file>]

  # Self-signed mode
  --self-signed RSA2048|ECC256
  --common-name <cn>
  --san <hostname>                             Repeatable
  [--country <CC>] [--state <state>] [--city <city>]
  [--company <org>] [--department <ou>] [--email <email>]
  [--comments <text>]

  # CA-only mode (update chain cert only)
  --ca-only
  --ca <file>

  # Full-body fallback
  [--file <path>]

  # Concurrency control
  [--if-unmodified-since <date>]               If-Unmodified-Since header (RFC 1123)
  [--example]

cdnpro cert delete <id>
cdnpro cert download-csr <id> [--dcv sectigo] [--out <file>]
cdnpro cert-version get <id> <version>
cdnpro cert-version delete <id> <version>
```

**Cert create/update implementation notes:**

- Exactly one of `--cert`/`--key` (upload), `--self-signed` (server-generated), `--ca-only`, or `--file` (raw body) must be provided; mixing mode flags is a validation error (exit code 4).
- **Upload mode** (`--cert` + `--key`): reads PEM files from disk, encrypts the private key with the server public key using `node-forge` (logic migrated from `build-cert-body.sh`), then builds `{ newVersion: { certificate, privateKey, chainCert } }`.
- **Self-signed mode** (`--self-signed`): builds `{ newVersion: { privateKey: "RSA2048"|"ECC256", certificate: "Generate", identificationInfo: { commonName, subjectAlternativeNames, ... }, comments } }`. `--san` is repeatable; values accumulate into the `subjectAlternativeNames` array. `--common-name` is required.
- **CA-only mode** (`--ca-only`): for `cert create`, sets top-level `caOnly: true` and `newVersion.chainCert` to the PEM-encoded CA chain. For `cert update`, sets only `newVersion.chainCert` (the existing `caOnly` flag on the record is preserved).
- **Full-body fallback** (`--file`): body passed through as-is; no client-side key encryption is performed.
- `cert update` sends `PATCH /cdn/certificates/{id}`. When a version mode is provided, the body includes a `newVersion` object using the same three-mode body construction. Metadata-only changes (e.g., `--name`) can be combined with a new version in a single PATCH.
- **`--example`** is mode-aware:
  - `--self-signed RSA2048 --example` → prints the RSA2048 self-signed example from the spec
  - `--self-signed ECC256 --example` → prints the ECC256 self-signed example
  - `--ca-only --example` → prints a CA-only body example
  - Default (no mode flag) → prints the upload example from the spec

### 4.3 `deploy` commands

```
cdnpro deploy list
  [--from <date>] [--to <date>]
  [--target staging|production]
  [--status waiting|inprogress|failed|succeeded]
  [--property <id>]                            Filter by property ID
  [--cert <id>]                                Filter by certificate ID
  [--search <term>]
  [--task-ids <id,...>]                        Comma-separated task IDs
  [--sort-by submissionTime|finishTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro deploy get <id>
cdnpro deploy create
  --target staging|production                  Deployment environment (required)

  # Action flags — at least one required; all are repeatable
  --deploy-property <id>@<version>             Deploy a property at the specified version (version required)
  --remove-property <id>                       Remove a property from the target environment
  --deploy-cert <id>@<version>                 Deploy a certificate at the specified version (version required)
  --remove-cert <id>                           Remove a certificate from the target environment

  # Optional task metadata
  [--name <name>]                              Friendly name for the deployment task
  [--webhook <id>]                             Webhook ID to call on task completion

  # Full-body fallback (mutually exclusive with action flags)
  [--file <path>]                              Full request body as JSON (- for stdin)

  # Polling
  [--wait]                                     Poll until task completes
  [--timeout <seconds>]                        Max wait time [default: 600]
  [--poll-interval <seconds>]                  Poll frequency [default: 30]

  # Bypass header flags
  [--skip-certificate-check]                   Send Check-Certificate: no — skip TLS cert expiry/SAN check
  [--skip-client-ca-certificate-check]         Send Check-Client-CA-Certificate: no
  [--skip-origin-auth-certificate-check]       Send Check-Origin-Auth-Certificate: no
  [--skip-usage-check]                         Send Check-Usage: no — skip active-hostname safety check

  [--example]
```

**Deploy create implementation notes:**

- At least one action flag (`--deploy-property`, `--remove-property`, `--deploy-cert`, `--remove-cert`) is required unless `--file` is used.
- The `@version` suffix is required for `--deploy-property` and `--deploy-cert`; the CLI must reject the flag with a validation error if it is omitted.
- Multiple action flags can be combined to compose multi-action tasks in a single API call:
  ```bash
  cdnpro deploy create \
    --target production \
    --deploy-property abc123@5 \
    --deploy-cert 592afa9f@1
  ```
  Each action flag appends an entry to the `actions` array in declaration order.
- Action flags map to `actions` entries as follows:
  - `--deploy-property id@v` → `{ action: "deploy_property", propertyId: "id", version: "v" }`
  - `--remove-property id` → `{ action: "remove_property", propertyId: "id" }`
  - `--deploy-cert id@v` → `{ action: "deploy_cert", certificateId: "id", version: "v" }`
  - `--remove-cert id` → `{ action: "remove_cert", certificateId: "id" }`
- `--file` bypasses action flag parsing entirely and sends the body as-is; useful for precise multi-action bodies not easily expressible as flags.
- `--example` prints the `"Deploy a property and a certificate to production"` example from the spec.

### 4.4 `validation` commands

```
cdnpro validation list
  [--from <date>] [--to <date>]
  [--property <id>]
  [--property-version <version>]
  [--status waiting|in-progress|failed|succeeded]
  [--search <term>]
  [--sort-by submissionTime|finishTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro validation get <id>
cdnpro validation create --file <path>
  [--wait]                                     Poll until validation completes
  [--timeout <seconds>]                        Max wait time [default: 300]
  [--poll-interval <seconds>]                  Poll frequency [default: 10]
 ``` 

### 4.5 `edge-hostname` commands

```
cdnpro edge-hostname list
  [--search <term>]
  [--has-beian]                                Filter to hostnames with Beian flag
  [--server-groups <group,...>]                Comma-separated server group filter
  [--sort-by creationTime|lastUpdateTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro edge-hostname get <name>
cdnpro edge-hostname create --file <path> [--example]
cdnpro edge-hostname update <name> --file <path>   # PATCH — send only fields that are changing; no fields required
  [--if-unmodified-since <date>]
cdnpro edge-hostname replace <name> --file <path>  # PUT  — full replacement; edgeHostname and clientZones required
  [--if-unmodified-since <date>]
cdnpro edge-hostname delete <name>
  [--skip-usage-check]                         Send Check-Usage: no — skip dependency safety check
```

### 4.6 `purge` and `prefetch` commands

```
cdnpro purge create
  --target staging|production                  Environment to purge (required)

  # What to purge — at least one of the following is required:
  --url <url>                                  Exact file URL; repeatable (no wildcards)
  --dir <url>                                  Directory URL with optional wildcard (* / **); repeatable; max 20
  --regex <pattern>                            Regex pattern starting with scheme://hostname/; repeatable; max 2
  --header <name:value>                        Request header for cache-key disambiguation; repeatable; applies to all --url entries

  # Optional
  [--action delete|invalidate]                 Purge action (default: invalidate)
  [--name <description>]                       Friendly name for the purge request
  [--webhook <id>]                             Webhook ID to call on completion

  # Full-body fallback
  [--file <path>]                              Full request body as JSON (- for stdin)

  # Polling
  [--wait]                                     Poll until purge completes
  [--timeout <seconds>]                        Max wait time [default: 600]
  [--poll-interval <seconds>]                  Poll frequency [default: 30]

  [--example]

cdnpro purge list
  [--from <date>] [--to <date>]
  [--target staging|production]
  [--action invalidate|delete]
  [--search <term>]                            Match on hostname or purge task ID
  [--sort-by submissionTime|finishTime]
  [--sort-order asc|desc]
  [--max-success-rate <0-1>]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro purge get <id>
cdnpro purge summary [--from <date>] [--to <date>] [--target staging|production]
cdnpro purge tokens  [--target staging|production]
```

```
cdnpro prefetch create --file <path>
  [--wait]                                     Poll until prefetch completes
  [--timeout <seconds>]                        Max wait time [default: 600]
  [--poll-interval <seconds>]                  Poll frequency [default: 30]

cdnpro prefetch list
  [--from <date>] [--to <date>]
  [--search <term>]
  [--sort-by submissionTime|finishTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro prefetch get <id>
cdnpro prefetch tokens  [--target staging|production]
```
### 4.7 `report` commands
# All report commands send a POST with an optional filters body.
# Common flags shared by most report commands:
#   --from <date>              RFC 3339 UTC start date (required)
#   --to <date>                RFC 3339 UTC end date (required)
#   --type fiveminutes|hourly|daily|monthly   Granularity (required for time-series)
#   --scheme http|https|all    Traffic type to include (default: all)
#   --hostname <h>             Repeatable; filter by client-facing hostname
#   --property <id>            Repeatable; filter by property ID
#   --property-hostname <h>    Repeatable; filter by property hostname pattern
#   --server-group <g>         Repeatable; filter by server group
#   --file <path>              Full filters body as JSON (overrides filter flags)
#   --report-range ...         Report-Range header (where supported)

# Time-series reports (require --from, --to, --type; support --scheme unless noted)
```
cdnpro report edge-bandwidth        --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report edge-volume           --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report edge-upload-volume    --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report edge-requests         --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report edge-status-codes     --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report origin-volume         --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report origin-requests       --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report origin-status-codes   --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report interm-volume         --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report cpu-time              --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report origin-fast-route-requests  --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report origin-fast-route-volume    --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report l7-volume             --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report l7-bandwidth          --from <d> --to <d> --type <t> [filters...] [--scheme] [--report-range]
cdnpro report edge-hostname-requests  --from <d> --to <d> --type <t> [--edge-hostname <h>]...   # no --scheme; no --report-range
```

# Summary reports (no --type; no --report-range; support --group-by)
# --group-by values: hostnames|serverGroups|customerIds|propertyHostnames|legacyTypes (repeatable, up to 2)
```
cdnpro report edge-bandwidth-summary         --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report edge-volume-summary            --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report edge-requests-summary         --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report edge-status-summary           --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report origin-status-summary         --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report cpu-summary                   --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report l7-volume-summary             --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report l7-bandwidth-summary          --from <d> --to <d> [filters...] [--scheme] [--group-by <field>]...
cdnpro report edge-hostname-requests-summary  --from <d> --to <d> [--edge-hostname <h>]...
```

# Log download (no --type; filters by hostname only)
```
cdnpro report logs --from <d> --to <d> [--hostname <h>]... [--file <path>]
```

# Other report related commands
```
cdnpro log-config list
  [--search <term>]                            Filter by hostname
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro log-config get <id>
cdnpro log-config create --file <path>
cdnpro log-config update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro log-config delete <id>
```
```
cdnpro log-aggregation-point list [--search <term>]
cdnpro log-aggregation-point get <id>
cdnpro log-aggregation-point create --file <path>
cdnpro log-aggregation-point update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro log-aggregation-point delete <id>
cdnpro log-aggregation-point summary
```
```
cdnpro annotation list
  [--from <date>] [--to <date>]
  [--type client|configuration|operation]
  [--search <term>]                            Filter by ID or comment text
  [--limit <n>] [--offset <n>] [--all]
cdnpro annotation get <id>
cdnpro annotation create --file <path> [--example]
cdnpro annotation update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro annotation delete <id>
```

### 4.8 Other commands

```
cdnpro hostname list
  [--search <term>]
  [--target all|staging|production]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro hostname get <hostname>
cdnpro hostname-history list
  [--from <date>] [--to <date>]
  [--search <term>]                            Filter by hostname prefix
  [--target staging|production|all]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro hostname-history get <hostname>
  [--from <date>] [--to <date>]
  [--target staging|production|all]
```

```
cdnpro webhook list
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro webhook get <id>
cdnpro webhook create --file <path>
cdnpro webhook update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro webhook delete <id>
```

```
cdnpro secret list
  [--search <term>]
  [--limit <n>] [--offset <n>] [--all]
cdnpro secret get <id>
cdnpro secret create --file <path>
cdnpro secret update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro secret delete <id>
```

```
cdnpro service-quota list
  [--search <term>]
  [--status active|suspended|trial|terminated]
  [--allow-production true|false]
  [--advanced-features realTimeLog|originShield]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro service-quota get <id>
cdnpro service-quota update <id> --file <path>
  [--if-unmodified-since <date>]
```  

```
cdnpro api-permission get <id>
cdnpro api-permission create --file <path>
cdnpro api-permission update <id> --file <path>
  [--if-unmodified-since <date>]
cdnpro api-permission delete <id>
```

```
cdnpro shield list
  [--search <term>]
  [--used-in-properties]                       Filter to shields referenced by at least one property
  [--sort-by lastUpdated|effectiveDate]
  [--sort-order asc|desc]
cdnpro shield get <id>
```

**Reference / read-only lookups** — no `--on-behalf-of`, no `--report-range`:

```
cdnpro isp list [--search <term>] [--region-code <code>] [--sort-order asc|desc]
cdnpro client-region list [--search <term>] [--isp-code <code>] [--sort-order asc|desc]
cdnpro staging-server list
cdnpro public-ip list
cdnpro origin-fast-route-ip list
cdnpro ip-details lookup --file <path>
cdnpro system-config get
```

### 4.9 `admin` commands (`/ngadmin/` endpoints)

These operate on reseller-managed sub-accounts and require elevated API credentials. Grouped under the `admin` parent command to make the privilege boundary explicit.

```
cdnpro admin customer list
  [--search <term>]
  [--ids <id,...>]                             Comma-separated customer IDs
  [--status active|suspended]
  [--products <product,...>]
  [--regional-offices <office,...>]
  [--sort-by creationTime|lastUpdateTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
cdnpro admin customer get <id>
cdnpro admin customer create --file <path> [--example]
cdnpro admin customer update <id> --file <path>

cdnpro admin contact list
  [--search <term>]
  [--ids <id,...>]
  [--status active|suspended|pending]
  [--is-master]                                Filter to master users only
  [--sort-by creationTime|lastLoginTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro admin contact get <id>
cdnpro admin contact create --file <path> [--example]
cdnpro admin contact update <id> --file <path>
cdnpro admin contact delete <id>

cdnpro admin api-account list
  [--search <term>]
  [--type operator|read-only]
  [--sort-by creationTime|lastUpdateTime]
  [--sort-order asc|desc]
  [--limit <n>] [--offset <n>] [--all]
  [--report-range self-only|self+children|children-only]
cdnpro admin api-account get <id>
cdnpro admin api-account create --file <path> [--example]
cdnpro admin api-account update <id> --file <path>
cdnpro admin api-account delete <id>

cdnpro admin apicall list
  [--from <date>] [--to <date>]                RFC 3339 UTC (spec: startdate/enddate)
  [--method GET|POST|PATCH|PUT|DELETE]
  [--path <uri>]                               Filter by API path
  [--safe true|false]
  [--caller <name-or-id>]                      Filter by API account name or ID
  [--for-customer <id|none|any>]               Filter by onbehalfof: customer ID, "none" (direct/portal calls), or "any" (all child calls; resellers only)
  [--status <code,...>]                        Comma-separated HTTP status codes or patterns (2xx, 4xx, etc.)
  [--before <apiRequestId>]                    Cursor for pagination: return calls made before this apiRequestId
  [--limit <n>]                                Page size [default: 100, max: 100]
  [--all]                                      Auto-paginate using cursor (--before); implies --output jsonl
  [--report-range self-only|self+children|children-only]
cdnpro admin apicall get <id>
```

Date formats accepted: ISO 8601 (`2026-01-01`), relative (`7d`, `24H`, `1M`).

---

## Phase 5 — OpenAPI-Driven Types, Validation & Schema Discovery

### 5.1 Type generation (build time)

Run as part of `npm run build` (chained before `tsc` in the `build` script):

```bash
npx openapi-typescript openapi.json -o src/types/api.ts
```

This produces typed path/method/response shapes that resource classes import. Result: zero-maintenance type safety on all API responses; the MCP server can also import these types when defining tool schemas.

### 5.2 Request body validation (runtime)

Located in `src/schema/validate.ts`. Uses `ajv` to validate any `--file` body before it is sent to the API.

```typescript
// src/schema/validate.ts
import Ajv, { ErrorObject } from 'ajv';
import { getRequestBodySchema } from './loader';

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
  schema: unknown;  // the resolved schema — used in 5.5
}

export function validateBody(openapiPath: string, method: string, body: unknown): ValidationResult {
  const { schema } = getRequestBodySchema(openapiPath, method);
  if (!schema) return { valid: true, errors: [], schema: null };

  const ajv = new Ajv({ allErrors: true, strict: false });
  const valid = ajv.validate(schema, body) as boolean;
  return { valid, errors: ajv.errors ?? [], schema };
}
```

On failure with `--output table` (human):
```
Error: Invalid request body
  - /name: must be string
  - /origins/0/hostname: must NOT have fewer than 1 characters
```

On failure with `--output json` (agent) — see 5.5 for the full error envelope.

### 5.3 `cdnpro schema` command

**Purpose:** Lets an AI agent (or human) introspect the full interface of any operation — request body schema, query parameters, accepted request headers, and response schema — before constructing a call. The command reads exclusively from the bundled `openapi.json`, which is the single source of truth for all of this information (including `Check-Certificate`, `Check-Usage`, `Report-Range`, and all other header parameters). No API call is made.

#### Command interface

```
cdnpro schema <resource> <operation> [--direction request|response|both]

  resource    One of:
                cdn resources:    property, property-version, cert, cert-version,
                                  deploy, validation, purge, prefetch, hostname, hostname-history,
                                  edge-hostname, annotation, webhook, secret, service-quota,
                                  api-permission, log-config, log-aggregation-point, shield
                reference data:   isp, client-region, staging-server, public-ip,
                                  origin-fast-route-ip, ip-details, system-config
                report:           report
                admin (ngadmin):  admin-customer, admin-contact, admin-api-account,
                                  admin-apicall
  operation   One of: list, get, create, update, delete, and resource-
              specific operations (e.g. download-csr, summary, tokens, lookup).
              Use `cdnpro schema hostname-history list` or `cdnpro schema hostname-history get`
              to inspect the history endpoints.
  --direction both      Show both request and response in one call [default]
              request   Show only the request interface (body schema + query params + headers)
              response  Show only the successful response body schema
```

#### CLI-to-OpenAPI mapping table (stored in `src/schema/query.ts`)

```typescript
// src/schema/query.ts

const OPERATION_MAP: Record<string, { method: string; path: string }> = {
  // Properties
  'property.list':                  { method: 'get',    path: '/cdn/properties' },
  'property.get':                   { method: 'get',    path: '/cdn/properties/{propertyID}' },
  'property.create':                { method: 'post',   path: '/cdn/properties' },
  'property.update':                { method: 'patch',  path: '/cdn/properties/{propertyID}' },
  'property.delete':                { method: 'delete', path: '/cdn/properties/{propertyID}' },
  // Property versions
  'property-version.list':          { method: 'get',    path: '/cdn/properties/{propertyID}/versions' },
  'property-version.get':           { method: 'get',    path: '/cdn/properties/{propertyID}/versions/{version}' },
  'property-version.create':        { method: 'post',   path: '/cdn/properties/{propertyID}/versions' },
  'property-version.update':        { method: 'patch',  path: '/cdn/properties/{propertyID}/versions/{version}' },
  'property-version.delete':        { method: 'delete', path: '/cdn/properties/{propertyID}/versions/{version}' },
  // Certificates
  'cert.list':                      { method: 'get',    path: '/cdn/certificates' },
  'cert.get':                       { method: 'get',    path: '/cdn/certificates/{certificateID}' },
  'cert.create':                    { method: 'post',   path: '/cdn/certificates' },
  'cert.update':                    { method: 'patch',  path: '/cdn/certificates/{certificateID}' },
  'cert.delete':                    { method: 'delete', path: '/cdn/certificates/{certificateID}' },
  'cert.download-csr':              { method: 'get',    path: '/cdn/certificates/{certificateID}/csr' },
  'cert-version.get':               { method: 'get',    path: '/cdn/certificates/{certificateID}/versions/{version}' },
  'cert-version.delete':            { method: 'delete', path: '/cdn/certificates/{certificateID}/versions/{version}' },
  // Edge hostnames
  'edge-hostname.list':             { method: 'get',    path: '/cdn/edgeHostnames' },
  'edge-hostname.get':              { method: 'get',    path: '/cdn/edgeHostnames/{edgeHostname}' },
  'edge-hostname.create':           { method: 'post',   path: '/cdn/edgeHostnames' },
  'edge-hostname.update':           { method: 'patch',  path: '/cdn/edgeHostnames/{edgeHostname}' },
  'edge-hostname.replace':          { method: 'put',    path: '/cdn/edgeHostnames/{edgeHostname}' },
  'edge-hostname.delete':           { method: 'delete', path: '/cdn/edgeHostnames/{edgeHostname}' },
  // Deployment & validation
  'deploy.list':                    { method: 'get',    path: '/cdn/deploymentTasks' },
  'deploy.get':                     { method: 'get',    path: '/cdn/deploymentTasks/{id}' },
  'deploy.create':                  { method: 'post',   path: '/cdn/deploymentTasks' },
  'validation.list':                { method: 'get',    path: '/cdn/validations' },
  'validation.get':                 { method: 'get',    path: '/cdn/validations/{id}' },
  'validation.create':              { method: 'post',   path: '/cdn/validations' },
  // Hostnames
  'hostname.list':                  { method: 'get',    path: '/cdn/hostnames' },
  'hostname.get':                   { method: 'get',    path: '/cdn/hostnames/{hostname}' },
  // Hostname history
  'hostname-history.list':          { method: 'get',    path: '/cdn/hostnames/historical' },
  'hostname-history.get':           { method: 'get',    path: '/cdn/hostnames/historical/{hostname}' },
  // Purges
  'purge.create':                   { method: 'post',   path: '/cdn/purges' },
  'purge.list':                     { method: 'get',    path: '/cdn/purges' },
  'purge.get':                      { method: 'get',    path: '/cdn/purges/{id}' },
  'purge.summary':                  { method: 'get',    path: '/cdn/purges/purgeSummary' },
  'purge.tokens':                   { method: 'get',    path: '/cdn/purges/purgeTokens' },
  // Annotations
  'annotation.create':              { method: 'post',   path: '/cdn/annotations' },
  'annotation.list':                { method: 'post',   path: '/cdn/annotationsList' },
  'annotation.get':                 { method: 'get',    path: '/cdn/annotations/{id}' },
  'annotation.update':              { method: 'patch',  path: '/cdn/annotations/{id}' },
  'annotation.delete':              { method: 'delete', path: '/cdn/annotations/{id}' },
  // Reports — time-series (POST with optional filters body)
  'report.edge-bandwidth':                    { method: 'post',   path: '/cdn/report/bandwidth' },
  'report.edge-volume':                       { method: 'post',   path: '/cdn/report/vol' },
  'report.edge-upload-volume':                { method: 'post',   path: '/cdn/report/upVol' },
  'report.edge-requests':                     { method: 'post',   path: '/cdn/report/req' },
  'report.edge-status-codes':                 { method: 'post',   path: '/cdn/report/statusCodeDetails' },
  'report.origin-volume':                     { method: 'post',   path: '/cdn/report/volOrigin' },
  'report.origin-requests':                   { method: 'post',   path: '/cdn/report/reqOrigin' },
  'report.origin-status-codes':               { method: 'post',   path: '/cdn/report/statusCodeDetailsOrigin' },
  'report.interm-volume':                     { method: 'post',   path: '/cdn/report/volInterm' },
  'report.cpu-time':                          { method: 'post',   path: '/cdn/report/cpuTime' },
  'report.origin-fast-route-requests':        { method: 'post',   path: '/cdn/report/fastOriginReq' },
  'report.origin-fast-route-volume':          { method: 'post',   path: '/cdn/report/fastOriginVol' },
  'report.l7-volume':                         { method: 'post',   path: '/cdn/report/volL7' },
  'report.l7-bandwidth':                      { method: 'post',   path: '/cdn/report/bandwidthL7' },
  'report.edge-hostname-requests':            { method: 'post',   path: '/cdn/report/edgeHostnameReq' },
  'report.logs':                              { method: 'post',   path: '/cdn/report/logDownload' },
  // Reports — summary (POST with optional filters + groupBy body; no --type)
  'report.edge-bandwidth-summary':            { method: 'post',   path: '/cdn/report/bandwidthSummary' },
  'report.edge-volume-summary':               { method: 'post',   path: '/cdn/report/volSummary' },
  'report.edge-requests-summary':             { method: 'post',   path: '/cdn/report/reqSummary' },
  'report.edge-status-summary':              { method: 'post',   path: '/cdn/report/edgeStatusSummary' },
  'report.origin-status-summary':             { method: 'post',   path: '/cdn/report/originStatusSummary' },
  'report.cpu-summary':                       { method: 'post',   path: '/cdn/report/cpuSummary' },
  'report.l7-volume-summary':                 { method: 'post',   path: '/cdn/report/volL7Summary' },
  'report.l7-bandwidth-summary':              { method: 'post',   path: '/cdn/report/bandwidthL7Summary' },
  'report.edge-hostname-requests-summary':    { method: 'post',   path: '/cdn/report/edgeHostnameReqSummary' },
  // Webhooks
  'webhook.list':                   { method: 'get',    path: '/cdn/webhooks' },
  'webhook.get':                    { method: 'get',    path: '/cdn/webhooks/{id}' },
  'webhook.create':                 { method: 'post',   path: '/cdn/webhooks' },
  'webhook.update':                 { method: 'patch',  path: '/cdn/webhooks/{id}' },
  'webhook.delete':                 { method: 'delete', path: '/cdn/webhooks/{id}' },
  // Secrets
  'secret.list':                    { method: 'get',    path: '/cdn/secrets' },
  'secret.get':                     { method: 'get',    path: '/cdn/secrets/{secretID}' },
  'secret.create':                  { method: 'post',   path: '/cdn/secrets' },
  'secret.update':                  { method: 'patch',  path: '/cdn/secrets/{secretID}' },
  'secret.delete':                  { method: 'delete', path: '/cdn/secrets/{secretID}' },
  // Service quotas
  'service-quota.list':             { method: 'get',    path: '/cdn/serviceQuotas' },
  'service-quota.get':              { method: 'get',    path: '/cdn/serviceQuotas/{serviceQuotaId}' },
  'service-quota.update':           { method: 'patch',  path: '/cdn/serviceQuotas/{serviceQuotaId}' },
  // Prefetches
  'prefetch.list':                  { method: 'get',    path: '/cdn/prefetches' },
  'prefetch.get':                   { method: 'get',    path: '/cdn/prefetches/{id}' },
  'prefetch.create':                { method: 'post',   path: '/cdn/prefetches' },
  'prefetch.tokens':                { method: 'get',    path: '/cdn/prefetches/prefetchTokens' },
  // API permissions
  'api-permission.get':             { method: 'get',    path: '/cdn/apiPermissions/{id}' },
  'api-permission.create':          { method: 'post',   path: '/cdn/apiPermissions' },
  'api-permission.update':          { method: 'patch',  path: '/cdn/apiPermissions/{id}' },
  'api-permission.delete':          { method: 'delete', path: '/cdn/apiPermissions/{id}' },
  // Log configs (under /cdn/report/)
  'log-config.list':                { method: 'get',    path: '/cdn/report/logConfigs' },
  'log-config.get':                 { method: 'get',    path: '/cdn/report/logConfigs/{id}' },
  'log-config.create':              { method: 'post',   path: '/cdn/report/logConfigs' },
  'log-config.update':              { method: 'patch',  path: '/cdn/report/logConfigs/{id}' },
  'log-config.delete':              { method: 'delete', path: '/cdn/report/logConfigs/{id}' },
  // Log aggregation points
  'log-aggregation-point.list':     { method: 'get',    path: '/cdn/logAggregationPoints' },
  'log-aggregation-point.get':      { method: 'get',    path: '/cdn/logAggregationPoints/{id}' },
  'log-aggregation-point.create':   { method: 'post',   path: '/cdn/logAggregationPoints' },
  'log-aggregation-point.update':   { method: 'patch',  path: '/cdn/logAggregationPoints/{id}' },
  'log-aggregation-point.delete':   { method: 'delete', path: '/cdn/logAggregationPoints/{id}' },
  'log-aggregation-point.summary':  { method: 'get',    path: '/cdn/logAggregationPoints/summaryReport' },
  // Shields (read-only)
  'shield.list':                    { method: 'get',    path: '/cdn/shields' },
  'shield.get':                     { method: 'get',    path: '/cdn/shields/{id}' },
  // Reference / read-only lookups
  'isp.list':                       { method: 'get',    path: '/cdn/isps' },
  'client-region.list':             { method: 'get',    path: '/cdn/clientRegions' },
  'staging-server.list':            { method: 'get',    path: '/cdn/stagingServers' },
  'public-ip.list':                 { method: 'get',    path: '/cdn/publicIpList' },
  'origin-fast-route-ip.list':      { method: 'get',    path: '/cdn/originFastRouteIpList' },
  'ip-details.lookup':              { method: 'post',   path: '/ngadmin/ipDetails' },
  'system-config.get':             { method: 'get',    path: '/cdn/systemConfigs' },
  // Admin endpoints (/ngadmin/)
  'admin-customer.list':            { method: 'get',    path: '/ngadmin/customers' },
  'admin-customer.get':             { method: 'get',    path: '/ngadmin/customers/{id}' },
  'admin-customer.create':          { method: 'post',   path: '/ngadmin/customers' },
  'admin-customer.update':          { method: 'patch',  path: '/ngadmin/customers/{id}' },
  'admin-contact.list':             { method: 'get',    path: '/ngadmin/contacts' },
  'admin-contact.get':              { method: 'get',    path: '/ngadmin/contacts/{id}' },
  'admin-contact.create':           { method: 'post',   path: '/ngadmin/contacts' },
  'admin-contact.update':           { method: 'patch',  path: '/ngadmin/contacts/{id}' },
  'admin-contact.delete':           { method: 'delete', path: '/ngadmin/contacts/{id}' },
  'admin-api-account.list':         { method: 'get',    path: '/ngadmin/apiAccounts' },
  'admin-api-account.get':          { method: 'get',    path: '/ngadmin/apiAccounts/{id}' },
  'admin-api-account.create':       { method: 'post',   path: '/ngadmin/apiAccounts' },
  'admin-api-account.update':       { method: 'patch',  path: '/ngadmin/apiAccounts/{id}' },
  'admin-api-account.delete':       { method: 'delete', path: '/ngadmin/apiAccounts/{id}' },
  'admin-apicall.list':             { method: 'get',    path: '/ngadmin/apicalls' },
  'admin-apicall.get':              { method: 'get',    path: '/ngadmin/apicalls/{id}' },
};
```

#### Output format

The `schema` command always emits JSON regardless of `--output`. The default `--direction both` returns a single object with nested `request` and `response` sub-objects, giving an agent the complete interface in one call. `--direction request` or `--direction response` return a flat object with only that side. All forms include a `requestHeaders` section (in the `request` object or at top level) populated from the spec's header parameters, so agents can map header names to CLI flags without consulting a separate source.

```bash
$ cdnpro schema deploy create
```

```json
{
  "operation": "createDeployment",
  "method": "POST",
  "path": "/cdn/deploymentTasks",
  "direction": "both",
  "request": {
    "required": true,
    "contentType": "application/json",
    "schema": {
      "type": "object",
      "required": ["target", "actions"],
      "properties": {
        "target": { "type": "string", "enum": ["staging", "production"] },
        "actions": { "type": "array", "items": { "type": "object" } },
        "name": { "type": "string" },
        "webhook": { "type": "string" }
      }
    },
    "requestHeaders": {
      "On-Behalf-Of": {
        "type": "string",
        "cliFlag": "--on-behalf-of",
        "description": "If you are a reseller, specify the ID of a child customer.",
        "required": false
      },
      "Check-Certificate": {
        "type": "string",
        "cliFlag": "--skip-certificate-check",
        "values": ["no"],
        "description": "Set to \"no\" to skip TLS certificate expiry/SAN validation during deployment.",
        "required": false
      },
      "Check-Client-CA-Certificate": {
        "type": "string",
        "cliFlag": "--skip-client-ca-certificate-check",
        "values": ["no"],
        "description": "Set to \"no\" to skip CA certificate validation for client verification.",
        "required": false
      },
      "Check-Origin-Auth-Certificate": {
        "type": "string",
        "cliFlag": "--skip-origin-auth-certificate-check",
        "values": ["no"],
        "description": "Set to \"no\" to skip certificate validation for origin authentication.",
        "required": false
      },
      "Check-Usage": {
        "type": "string",
        "cliFlag": "--skip-usage-check",
        "values": ["no"],
        "description": "Set to \"no\" to bypass the dependency/usage safety check.",
        "required": false
      }
    }
  },
  "response": {
    "httpStatus": 201,
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" }
      }
    }
  }
}
```

```bash
$ cdnpro schema property update
```

```json
{
  "operation": "updateProperty",
  "method": "PATCH",
  "path": "/cdn/properties/{propertyID}",
  "direction": "both",
  "request": {
    "required": false,
    "contentType": "application/json",
    "schema": { "type": "object", "properties": { "description": { "type": "string" } } },
    "requestHeaders": {
      "On-Behalf-Of": {
        "type": "string",
        "cliFlag": "--on-behalf-of",
        "description": "If you are a reseller, specify the ID of a child customer.",
        "required": false
      },
      "If-Unmodified-Since": {
        "type": "string",
        "cliFlag": "--if-unmodified-since",
        "description": "RFC 1123 timestamp. Server returns HTTP 412 if the resource was modified after this date, preventing accidental overwrites.",
        "required": false
      }
    }
  },
  "response": {
    "httpStatus": 204,
    "schema": null
  }
}
```

```bash
$ cdnpro schema property list
```

For GET operations the `request` sub-object contains `queryParameters` and `requestHeaders` (no `schema` or `contentType`):

```json
{
  "operation": "getPropertyList",
  "method": "GET",
  "path": "/cdn/properties",
  "direction": "both",
  "request": {
    "queryParameters": {
      "search": { "type": "string", "description": "Keyword search" },
      "target": { "type": "string", "enum": ["staging", "production"] },
      "limit": { "type": "integer", "default": 10 },
      "offset": { "type": "integer", "default": 0 },
      "sortBy": { "type": "string" },
      "sortOrder": { "type": "string", "enum": ["asc", "desc"] }
    },
    "requestHeaders": {
      "On-Behalf-Of": {
        "type": "string",
        "cliFlag": "--on-behalf-of",
        "description": "If you are a reseller, specify the ID of a child customer.",
        "required": false
      },
      "Report-Range": {
        "type": "string",
        "cliFlag": "--report-range",
        "values": ["self-only", "self+children", "children-only"],
        "default": "self-only",
        "description": "Specify whether to include data from child customers.",
        "required": false
      }
    }
  },
  "response": {
    "httpStatus": 200,
    "schema": { "type": "array", "items": { "type": "object" } }
  }
}
```

```bash
$ cdnpro schema edge-hostname delete
```

```json
{
  "operation": "deleteEdgeHostname",
  "method": "DELETE",
  "path": "/cdn/edgeHostnames/{edgeHostname}",
  "direction": "both",
  "request": {
    "requestHeaders": {
      "On-Behalf-Of": {
        "type": "string",
        "cliFlag": "--on-behalf-of",
        "description": "If you are a reseller, specify the ID of a child customer.",
        "required": false
      },
      "Check-Usage": {
        "type": "string",
        "cliFlag": "--skip-usage-check",
        "values": ["no"],
        "description": "Set to \"no\" to bypass the check that prevents deletion of an edge hostname still referenced by properties.",
        "required": false
      }
    }
  },
  "response": {
    "httpStatus": 204,
    "schema": null
  }
}
```

```bash
$ cdnpro schema property create --direction response
```

When only the response side is needed, pass `--direction response` to get a flat object:

```json
{
  "operation": "createProperty",
  "method": "POST",
  "path": "/cdn/properties",
  "direction": "response",
  "httpStatus": 201,
  "schema": {
    "type": "object",
    "properties": {
      "propertyId": { "type": "string" },
      "name": { "type": "string" },
      "createdDate": { "type": "string", "format": "date-time" }
    }
  }
}
```

The `cliFlag` field in each header entry is the key detail for AI agents: it maps the HTTP header name directly to the flag the agent should pass on the corresponding CLI command.

#### Implementation in `src/schema/loader.ts`

```typescript
// src/schema/loader.ts
import openapiRaw from '../../openapi.json';

let _spec: typeof openapiRaw | null = null;

export function getSpec() {
  if (!_spec) _spec = openapiRaw;
  return _spec;
}

/**
 * Returns all header parameters for an operation as a requestHeaders map.
 * Each entry includes the cliFlag derived from the header name, so agents
 * can map header names directly to CLI flags without guessing.
 */
export function getRequestHeaders(openapiPath: string, method: string): Record<string, unknown> {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[openapiPath]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const params = op?.parameters as Array<Record<string, unknown>> | undefined ?? [];
  const result: Record<string, unknown> = {};

  for (const p of params) {
    if (p.in !== 'header') continue;
    const schema = p.schema as Record<string, unknown> | undefined;
    result[p.name as string] = {
      type: schema?.type ?? 'string',
      cliFlag: headerNameToCliFlag(p.name as string),
      ...(schema?.enum ? { values: schema.enum } : {}),
      ...(schema?.default !== undefined ? { default: schema.default } : {}),
      description: (p.description as string | undefined)?.replace(/<[^>]+>/g, '').trim() ?? '',
      required: p.required ?? false,
    };
  }

  return result;
}

/**
 * Maps an HTTP header name to the CLI flag convention.
 * Default rule: lowercase and hyphenate — "On-Behalf-Of" -> "--on-behalf-of"
 * Override for headers where the default name would be ambiguous or non-idiomatic:
 *   - Check-* bypass headers use --skip-* to make the intent explicit
 *   - If-Unmodified-Since maps naturally but is listed for clarity
 */
function headerNameToCliFlag(headerName: string): string {
  const overrides: Record<string, string> = {
    'Check-Certificate':             '--skip-certificate-check',
    'Check-Client-CA-Certificate':   '--skip-client-ca-certificate-check',
    'Check-Origin-Auth-Certificate': '--skip-origin-auth-certificate-check',
    'Check-Usage':                   '--skip-usage-check',
  };
  return overrides[headerName] ?? '--' + headerName.toLowerCase().replace(/\s+/g, '-');
}

export function getRequestBodySchema(path: string, method: string) {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  if (!op) return { schema: null, required: false };
  const content = (op.requestBody as Record<string, unknown> | undefined)
    ?.content as Record<string, Record<string, unknown>> | undefined;
  const schema = content?.['application/json']?.schema ?? null;
  return { schema, required: !!(op.requestBody as Record<string, unknown> | undefined)?.required };
}

export function getResponseSchema(path: string, method: string) {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const responses = op?.responses as Record<string, unknown> | undefined;
  const response = responses?.['200'] ?? responses?.['201'] ?? responses?.['204'];
  const content = (response as Record<string, unknown> | undefined)
    ?.content as Record<string, Record<string, unknown>> | undefined;
  return { schema: content?.['application/json']?.schema ?? null, httpStatus: responses?.['201'] ? 201 : responses?.['204'] ? 204 : 200 };
}

export function getQueryParameters(path: string, method: string) {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[path]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const params = op?.parameters as Array<Record<string, unknown>> | undefined;
  if (!params) return null;
  const result: Record<string, unknown> = {};
  for (const p of params) {
    if (p.in === 'query') {
      result[p.name as string] = { ...(p.schema as object), description: p.description };
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}
```

### 5.4 `--example` flag

**Purpose:** On any command that accepts `--file`, `--example` prints a ready-to-use JSON body and exits without making an API call. This gives an AI agent a concrete starting point when `cdnpro schema` returns an abstract schema.

`--example` is available on: `property create`, `property update`, `property version create`, `property version update`, `cert create`, `cert update` (mode-aware — see Section 4.2), `deploy create`, and any other command that accepts `--file`.

#### Precedence of example sources

The example body is resolved from these sources in order:

1. **OpenAPI spec `examples` field** — many operations in the spec include named examples. Use the first available example's `value`.
2. **OpenAPI spec `example` field** — the singular `example` on the schema or media type object.
3. **Synthesized from schema** — when neither is present, generate a minimal valid body from the JSON Schema (see synthesis rules below).

#### Implementation in `src/schema/synthesize.ts`

```typescript
// src/schema/synthesize.ts
import { getSpec, getRequestBodySchema } from './loader';

/**
 * Returns an example body for the given operation.
 * First tries spec examples; falls back to synthesis.
 */
export function getExampleBody(openapiPath: string, method: string): unknown {
  const spec = getSpec();
  const op = (spec.paths as Record<string, Record<string, unknown>>)[openapiPath]?.[method.toLowerCase()] as Record<string, unknown> | undefined;
  const mediaType = (op?.requestBody as Record<string, unknown> | undefined)
    ?.content?.['application/json'] as Record<string, unknown> | undefined;
  if (!mediaType) return null;

  // Source 1: named examples object  { examples: { foo: { value: {...} } } }
  const examples = mediaType.examples as Record<string, { value: unknown }> | undefined;
  if (examples) {
    const first = Object.values(examples)[0];
    if (first?.value !== undefined) return first.value;
  }

  // Source 2: singular example field
  if (mediaType.example !== undefined) return mediaType.example;

  // Source 3: example embedded on the schema itself
  const schema = mediaType.schema as Record<string, unknown> | undefined;
  if (schema?.example !== undefined) return schema.example;

  // Source 4: synthesize from the JSON Schema
  return synthesizeFromSchema(schema ?? {});
}

/**
 * Synthesis rules (applied recursively):
 * - object: recurse into all `required` properties; include optional properties with (optional) annotation
 * - array: produce a single-element array using the `items` schema
 * - string with enum: use the first enum value
 * - string with format "date-time": use a fixed ISO timestamp
 * - string with format "date": use a fixed ISO date
 * - string: use the property name as a placeholder, e.g. "<propertyName>"
 * - integer / number: use 0 (or `minimum` if defined)
 * - boolean: use false
 * - null: use null
 * - $ref: resolve against the spec's `components.schemas` and recurse
 */
function synthesizeFromSchema(
  schema: Record<string, unknown>,
  key = 'value',
  _seen = new Set<string>(),
): unknown {
  if (!schema || typeof schema !== 'object') return null;

  // Resolve $ref — guard against circular references
  if (schema.$ref) {
    const ref = schema.$ref as string;
    if (_seen.has(ref)) return `<recursive:${ref}>`;
    _seen.add(ref);
    const resolved = resolveRef(ref);
    return resolved ? synthesizeFromSchema(resolved, key, _seen) : null;
  }

  const type = schema.type as string | undefined;

  if (type === 'object' || schema.properties) {
    const props = schema.properties as Record<string, unknown> | undefined ?? {};
    const required = (schema.required as string[] | undefined) ?? [];
    const result: Record<string, unknown> = {};
    // Always include required fields
    for (const reqKey of required) {
      result[reqKey] = synthesizeFromSchema(props[reqKey] as Record<string, unknown> ?? {}, reqKey, _seen);
    }
    // Include non-required fields marked with a comment so the agent knows they are optional
    for (const [optKey, optSchema] of Object.entries(props)) {
      if (!required.includes(optKey)) {
        result[`_optional_${optKey}`] = synthesizeFromSchema(optSchema as Record<string, unknown>, optKey, _seen);
      }
    }
    return result;
  }

  if (type === 'array') {
    const items = schema.items as Record<string, unknown> | undefined;
    return [items ? synthesizeFromSchema(items, key, _seen) : null];
  }

  if (type === 'string') {
    if (schema.enum) return (schema.enum as unknown[])[0];
    if (schema.format === 'date-time') return '2026-01-01T00:00:00Z';
    if (schema.format === 'date') return '2026-01-01';
    return `<${key}>`;
  }

  if (type === 'integer' || type === 'number') {
    return (schema.minimum as number | undefined) ?? 0;
  }

  if (type === 'boolean') return false;

  return null;
}

function resolveRef(ref: string): Record<string, unknown> | null {
  // Handles local refs only: "#/components/schemas/Foo"
  const spec = getSpec();
  const parts = ref.replace(/^#\//, '').split('/');
  let node: unknown = spec;
  for (const part of parts) {
    node = (node as Record<string, unknown>)[part];
    if (node === undefined) return null;
  }
  return node as Record<string, unknown>;
}
```

#### Output and usage

```bash
$ cdnpro property create --example
```

```json
{
  "name": "<name>",
  "version": {
    "description": "<description>",
    "edgeLogic": "<edgeLogic>",
    "origins": [
      {
        "hostname": "<hostname>",
        "_optional_port": 80,
        "_optional_protocol": "http"
      }
    ]
  },
  "_optional_description": "<description>"
}
```

The `_optional_*` prefix is a deliberate signal — the agent (or human) knows it can remove those keys and the request will still be valid. After editing, pipe it directly:

```bash
cdnpro property create --example \
  | jq 'del(._optional_description) | .name = "prod-site" | .version.description = "v1"' \
  | cdnpro property create --file -
```

For operations where the spec includes named examples, the output is the actual example value from the spec, which is more realistic than synthesized output.

### 5.5 Schema included in validation error output

**Purpose:** When a `--file` body fails validation, include the full JSON Schema in the JSON-mode error response so an AI agent can read the schema and self-correct in one round-trip, without needing to run `cdnpro schema` separately.

This applies only when `--output json` is active (explicitly or auto-detected because stdout is not a TTY).

#### Error envelope structure

```typescript
// src/cli/errors.ts

interface ValidationErrorEnvelope {
  error: {
    code: 'VALIDATION';
    message: string;
    validationErrors: Array<{
      path: string;      // JSON pointer, e.g. "/origins/0/hostname"
      message: string;   // Human-readable message from ajv
      keyword: string;   // ajv keyword: "required", "type", "minLength", etc.
      params: unknown;   // ajv params object
    }>;
    schema: unknown;     // The full resolved JSON Schema that was validated against
    hint: string;        // Points to --example flag
  };
}
```

#### Example output

```bash
$ echo '{"version":{"description":"v1"}}' | cdnpro property create --file - --output json
```

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Request body failed schema validation (1 error)",
    "validationErrors": [
      {
        "path": "",
        "message": "must have required property 'name'",
        "keyword": "required",
        "params": { "missingProperty": "name" }
      }
    ],
    "schema": {
      "type": "object",
      "required": ["name", "version"],
      "properties": {
        "name": { "type": "string", "maxLength": 100 },
        "description": { "type": "string" },
        "version": {
          "type": "object",
          "required": ["description"],
          "properties": {
            "description": { "type": "string" },
            "edgeLogic": { "type": "string" }
          }
        }
      }
    },
    "hint": "Run `cdnpro property create --example` to see a valid body template"
  }
}
```

Exit code is `4` (VALIDATION), which is distinct from API errors (codes 2–3, 5–10), so an agent can branch its error handling without parsing the JSON body.

#### Implementation in the command layer

```typescript
// src/cli/commands/property/create.ts  (representative example)

import { validateBody } from '../../../schema/validate';
import { handleError, CliError } from '../../errors';
import { print } from '../../output';

async function run(filePath: string, opts: CreateOptions) {
  const body = readBodyFile(filePath);  // reads file or stdin

  const { valid, errors, schema } = validateBody('/cdn/properties', 'post', body);
  if (!valid) {
    const envelope = {
      error: {
        code: 'VALIDATION',
        message: `Request body failed schema validation (${errors.length} error${errors.length !== 1 ? 's' : ''})`,
        validationErrors: errors.map(e => ({
          path: e.instancePath || '',
          message: e.message ?? '',
          keyword: e.keyword,
          params: e.params,
        })),
        schema,
        hint: 'Run `cdnpro property create --example` to see a valid body template',
      },
    };
    // In table mode, print human-friendly text; in json mode, print the full envelope
    if (opts.output === 'table' || (opts.output == null && process.stdout.isTTY)) {
      console.error('Error: Invalid request body');
      for (const e of errors) console.error(`  - ${e.instancePath || 'body'}: ${e.message}`);
      console.error(`\nTip: run \`cdnpro property create --example\` for a valid template`);
    } else {
      process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
    }
    process.exit(EXIT_CODES.VALIDATION);
  }

  // Validation passed — send the request
  const client = createClient(opts);
  const result = await client.properties.create(body);
  print(result, opts.output);
}
```

---

## Phase 6 — Async Operation Handling (`--wait`)

```typescript
// src/cli/wait.ts

export interface WaitOptions {
  timeout: number;       // seconds; default varies by task type: 600 (deploy/purge/prefetch), 300 (validation)
  pollInterval: number;  // seconds; default varies by task type: 30 (deploy/purge/prefetch), 10 (validation)
  outputFormat?: OutputFormat;
}

export async function waitForTask(
  getTask: (id: string) => Promise<unknown>,
  taskId: string,
  opts: WaitOptions,
): Promise<unknown> {
  const deadline = Date.now() + opts.timeout * 1000;
  const isInteractive = process.stdout.isTTY
    && opts.outputFormat !== 'json'
    && opts.outputFormat !== 'jsonl';

  const spinner = isInteractive ? ora(`Waiting for task ${taskId}`).start() : null;

  while (Date.now() < deadline) {
    const task = await getTask(taskId) as Record<string, unknown>;
    const pct  = (task.progressPercent as number | undefined) ?? 0;
    const status = task.status as string;

    if (isInteractive) {
      spinner!.text = `Task ${taskId}: ${status} ${pct}%`;
    } else {
      // Machine-readable: one NDJSON status line per poll
      process.stdout.write(JSON.stringify({ event: 'poll', taskId, status, progressPercent: pct }) + '\n');
    }

    if (status === 'succeeded') {
      spinner?.succeed(`Task ${taskId} completed`);
      if (!isInteractive) {
        process.stdout.write(JSON.stringify({ event: 'done', taskId, data: task }) + '\n');
      }
      return task;
    }

    if (status === 'failed') {
      spinner?.fail(`Task ${taskId} failed`);
      throw new CliError('ERROR', `Task failed: ${(task.failReason as string | undefined) ?? 'unknown reason'}`);
    }

    await new Promise(r => setTimeout(r, opts.pollInterval * 1000));
  }

  throw new CliError('TIMEOUT', `Task ${taskId} did not complete within ${opts.timeout}s`);
}
```

Each command passes its own getter. For example, `deploy create` passes `(id) => client.deploymentTasks.get(id)`, `validation create` passes `(id) => client.validations.get(id)`, `purge create` passes `(id) => client.purges.get(id)`, and `prefetch create` passes `(id) => client.prefetches.get(id)`.

**Human usage:**

```
$ cdnpro deploy create --deploy-property abc123@<version> --target production --wait
⠸ Task t-xyz: distributing 60%
✓ Task t-xyz completed
```

**AI agent / scripted usage:**

```
$ cdnpro deploy create --deploy-property abc123@<version> --target production --wait --output json
{"event":"poll","taskId":"t-xyz","status":"distributing","progressPercent":40}
{"event":"poll","taskId":"t-xyz","status":"distributing","progressPercent":80}
{"event":"done","taskId":"t-xyz","data":{"status":"succeeded","completedAt":"2026-06-05T10:00:00Z"}}
```

---

## Phase 8 — Self-Update (`cdnpro update`)

### 8.1 `src/cli/updater.ts`

Shared module used by both the `update` command and the passive startup notifier.

**Registry fetch** — uses the built-in `https` module to call `https://registry.npmjs.org/cdnpro-cli/latest`. No external dependency. 8-second timeout; network failures are silently swallowed in notifier mode.

**Version comparison** — inline semver comparison (major/minor/patch). No `semver` package.

**Install-scope detection** — returns `{ scope, projectRoot?, packageManager? }`:

| Scope | Detection logic |
|---|---|
| `npx` | `process.argv[1]` contains `_npx` or `npx-cache` |
| `global` | `process.argv[1]` starts with the path returned by `npm root -g` |
| `local` | Walk up from `process.cwd()` to find the nearest `package.json` that lists `cdnpro-cli` as a dependency |

For local scope, the package manager is inferred from the lock file present at the project root (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, otherwise npm).

**Update command builder** — maps scope + package manager to the correct install invocation:

| Scope | Package manager | Command |
|---|---|---|
| global | npm | `npm install -g cdnpro-cli@latest` |
| local | npm | `npm install cdnpro-cli@latest` (in project root) |
| local | yarn | `yarn add cdnpro-cli@latest` (in project root) |
| local | pnpm | `pnpm add cdnpro-cli@latest` (in project root) |
| npx | — | no-op; print message and exit |

**Update runner** — spawns with `stdio: 'inherit'` so live npm output is streamed to the terminal. Uses `shell: true` on Windows to handle `.cmd` shims.

**Startup notifier** — `scheduleUpdateCheck()` fires a background registry fetch (non-blocking, not awaited). Throttled to once per 24 hours; the last-check timestamp and latest known version are persisted in a separate `conf` store (`update-notifier.json`, same directory as `config.json`). Skips entirely when `process.stdout.isTTY` is false (piped / agent mode). `printUpdateNotice()` writes a single line to **stderr** after the command completes, so stdout remains clean for pipelines.

### 8.2 `cdnpro update` command

```
cdnpro update
  [--check]   Check for an update and exit without installing.
              Exit code 0 = already up to date; exit code 1 = update available.
              Useful in CI to assert a minimum version.
  [-y/--yes]  Skip the confirmation prompt.
```

Execution flow:

1. Detect install scope — exit cleanly with an explanatory message if invoked via `npx`.
2. Fetch latest version from the npm registry; print a spinner-style progress message.
3. If already on the latest version, print confirmation and exit 0.
4. Print the version diff (`2.0.0 → 2.1.0`) and the exact command that will run.
5. If `--check`, exit 1 (update available).
6. Unless `--yes`, prompt `Proceed with update? [y/N]`.
7. Spawn the update command with `stdio: 'inherit'`; forward its exit code.

### 8.3 Wiring in `main.ts`

- `scheduleUpdateCheck()` called once at module load (before `program.parseAsync`).
- `postAction` hook on the root command calls `printUpdateNotice()` after every command finishes.

---

## Phase 7 — Shell Completion

Commander.js does not auto-generate completion scripts; write them explicitly.

```
cdnpro completion bash       Print bash completion script
cdnpro completion zsh        Print zsh completion script
cdnpro completion fish       Print fish completion script
cdnpro completion powershell Print PowerShell completion script
```

Installation:

```bash
cdnpro completion bash >> ~/.bashrc && source ~/.bashrc
cdnpro completion zsh  >> ~/.zshrc  && source ~/.zshrc
```

Completions cover:
- All subcommand names (static, generated from command definitions)
- All flag names (static)
- `--profile` values: dynamic, read from `~/.config/cdnpro/config.json`
- `--target` values: `staging`, `production` (static enum)
- `--output` values: `table`, `json`, `jsonl` (static enum)
- `--resource` and `--operation` values for `cdnpro schema`: static, derived from the OPERATION_MAP

Dynamic completions for property IDs, cert IDs, etc. are intentionally omitted — they require an API call and would make tab-completion feel slow.

---

## Implementation Order

| Phase | Deliverable | Dependency |
|---|---|---|
| 1 | TypeScript setup; migrate client library | none |
| 2 | Config system; `auth` commands | Phase 1 |
| 3 | Output formatter; `errors.ts` | Phase 1 |
| 5.1 | `openapi-typescript` type generation | Phase 1 |
| 6 | `--wait` async poller (`wait.ts`) | Phases 2, 3 |
| 4.1 | `property` and `property-version` commands | Phases 2, 3 |
| 4.2 | `cert` commands | Phases 2, 3 |
| 4.3 | `deploy` commands | Phases 2, 3, 6 |
| 4.4 | `validation` commands | Phases 2, 3, 6 |
| 4.5 | `edge-hostname` commands | Phases 2, 3 |
| 4.6 | `purge` and `prefetch` commands | Phases 2, 3, 6 |
| 4.7 | `report` commands | Phases 2, 3 |
| 4.8 | `hostname`, `webhook`, `secret`, `service-quota`, `api-permission`, `shield`, reference commands | Phases 2, 3 |
| 4.9 | `admin` commands | Phases 2, 3 |
| 5.2 | Runtime body validation via `ajv` | Phase 5.1 |
| 5.3 | `cdnpro schema` command | Phase 5.1 |
| 5.4 | `--example` flag | Phase 5.1 |
| 5.5 | Schema field in validation error JSON | Phases 5.2, 5.3 |
| 7 | Shell completion | Phase 4 complete |
| 8 | `cdnpro update` command + startup notifier | Phase 1 |

---

## Summary of AI-Agent Affordances

| Capability | Mechanism |
|---|---|
| Discover what commands exist | `cdnpro --help`, `cdnpro <resource> --help` |
| Learn schema before constructing a body | `cdnpro schema <resource> <operation>` |
| Get a concrete body template | `cdnpro property create --example` |
| Self-correct a bad body without a second tool call | Schema embedded in VALIDATION error JSON (exit 4) |
| Parse all output programmatically | JSON envelope with `data` + `meta`; auto-JSON when not TTY |
| Distinguish error types without parsing text | Typed exit codes 0–9 |
| Feed output of one command into another | `--file -` (stdin) on all create/update commands |
| Stream large result sets | `--all` + JSONL output |
| Wait on async operations | `--wait` with NDJSON status stream |
