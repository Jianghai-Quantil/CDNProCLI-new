# CDNPro CLI

A TypeScript-based command-line interface and programmable library for the [CDN Pro API](https://docs.cdnetworks.com) by CDNetworks.

## Features

- Full coverage of CDN Pro REST APIs: properties, certificates, deployments, edge hostnames, cache operations, reports, and more
- Profile-based credential management (multiple environments/accounts)
- Auto-detects output format: human-readable tables in interactive terminals for `list` commands, JSON when piped
- `--wait` flag on async operations (deploys, validations, purges, prefetches) polls until completion
- OpenAPI schema introspection via `cdnpro schema` — useful for AI agents and tooling
- Shell completion for bash, zsh, fish, and PowerShell
- Self-update via `cdnpro update` — detects global vs. local install and uses the right package manager
- Importable TypeScript/Node.js library for programmatic use

## Installation

**Prerequisites:** Node.js 18+

```bash
npm install -g cdnpro-cli
```

Verify:

```bash
cdnpro --version
```

### Install from source

```bash
git clone https://github.com/mileweb/CDNProCLI-new.git
cd CDNProCLI-new
npm install
npm run build
npm install -g .
```

## Authentication

CDNPro CLI resolves credentials in this order:

1. CLI flags: `--host`, `--user`, `--secret-key`
2. Environment variables: `CDNPRO_HOST`, `CDNPRO_USER`, `CDNPRO_SECRETKEY`
3. Named profile (via `--profile <name>` or `CDNPRO_PROFILE` env var)
4. Default saved profile

### Saving a profile

```bash
cdnpro auth login
# Prompts for host, username, and secret key. Saves as the default profile.

cdnpro auth login --profile staging
# Saves a named profile called "staging"
```

### Managing profiles

```bash
cdnpro auth list                   # Show all saved profiles
cdnpro auth switch staging         # Switch default profile
cdnpro auth status                 # Show active profile and server info
cdnpro auth logout                 # Remove the default profile
cdnpro auth logout --profile staging
```

Credentials are stored securely:
- **Secret key** — stored in the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). If the keychain is unavailable (headless server, CI), a one-time warning is shown and the secret falls back to the config file.
- **Host and username** — stored in the config file:
  - Linux/macOS: `~/.config/cdnpro/config.json`
  - Windows: `%APPDATA%\cdnpro\config.json`

## Global Options

These options are available on every command:

| Option | Description |
|---|---|
| `-p, --profile <name>` | Credential profile to use |
| `--host <host>` | Override API host |
| `--user <user>` | Override API username |
| `--secret-key <key>` | Override API secret key |
| `-o, --output <format>` | Output format: `table`, `json`, or `jsonl` |
| `--no-color` | Disable colored output |
| `-v, --verbose` | Increase verbosity (`-vv` for more) |
| `--on-behalf-of <id>` | Reseller: act on behalf of a customer |

## Output Formats

| Format | When used | Description |
|---|---|---|
| `table` | `list` commands in interactive TTY (default) | Human-readable ASCII table |
| `json` | Piped/non-TTY (default), and all non-list commands | Single JSON envelope |
| `jsonl` | Explicit `--output jsonl` | One JSON object per line (streaming) |

## Commands

### Properties

```bash
cdnpro property list [--search <keyword>] [--target <staging|production>]
                     [--has-config <value>] [--sort-by <field>]
                     [--sort-order <asc|desc>] [--limit <n>] [--offset <n>]
                     [--report-range <scope>] [--all]
cdnpro property get <id>
cdnpro property create [--file <path>]   # --example prints an example body
cdnpro property update <id> [--file <path>]
cdnpro property delete <id>
```

#### Property versions

```bash
cdnpro property-version list <propertyId> [--search <term>] [--sort-by <field>]
                                  [--sort-order <asc|desc>] [--limit <n>]
                                  [--offset <n>] [--all]
cdnpro property-version get <propertyId> <version>
cdnpro property-version create <propertyId> [--file <path>]
cdnpro property-version update <propertyId> <version> [--file <path>]
cdnpro property-version delete <propertyId> <version>
```

### Certificates

```bash
cdnpro cert list [--search <keyword>] [--target <all|staging|production>]
                 [--ca-only] [--auto-renew <LE|Off>] [--sort-by <field>]
                 [--sort-order <asc|desc>] [--limit <n>] [--offset <n>]
                 [--report-range <scope>] [--all]
cdnpro cert get <id>
cdnpro cert create [--name <name>] [--file <path>] [--example]
                   # Upload mode:
                   --cert <file> --key <file> [--ca <file>] [--comments <text>]
                   # Self-signed mode:
                   --self-signed <RSA2048|ECC256> --common-name <cn>
                     [--san <hostname>...] [--country <CC>] [--state <state>]
                     [--city <city>] [--company <org>] [--department <ou>]
                     [--email <email>] [--comments <text>]
                   # CA-only mode:
                   --ca-only --ca <file> [--comments <text>]
cdnpro cert update <id> [--name <name>] [--file <path>] [--example]
                        [--if-unmodified-since <date>]
                        # Upload mode, self-signed mode, CA-only mode:
                        # same flags as `cert create`
cdnpro cert delete <id>
cdnpro cert download-csr <id> [--dcv <provider>] [--out <file>]
```

`cert create` and `cert update` support three mutually exclusive creation modes plus `--file`:

| Mode | Trigger flags | Description |
|---|---|---|
| **Upload** | `--cert <file>` + `--key <file>` | Upload a PEM certificate and private key. The private key is encrypted client-side (AES-128-CBC with HMAC-SHA256 key derivation) before transmission. Use `--ca <file>` to include the CA chain. |
| **Self-signed** | `--self-signed <RSA2048\|ECC256>` | Have the server generate the certificate and private key. Requires `--common-name`. Repeatable `--san` for Subject Alternative Names. Optional subject fields: `--country`, `--state`, `--city`, `--company`, `--department`, `--email`. |
| **CA-only** | `--ca-only --ca <file>` | Register a CA certificate without a leaf certificate or private key. |
| **File** | `--file <path>` | Provide the full JSON request body. Use `--example` to print a schema-based example body and exit. |

**Upload mode flags** (`cert create` / `cert update`):

| Flag | Description |
|---|---|
| `--cert <file>` | Path to PEM certificate file (required) |
| `--key <file>` | Path to PEM private key file (required) |
| `--ca <file>` | Path to PEM CA chain file |
| `--comments <text>` | Version comments |

**Self-signed mode flags** (`cert create` / `cert update`):

| Flag | Description |
|---|---|
| `--self-signed <alg>` | Algorithm: `RSA2048` or `ECC256` (required) |
| `--common-name <cn>` | Common Name for the certificate (required) |
| `--san <hostname>` | Subject Alternative Name (repeatable) |
| `--country <CC>` | 2-letter ISO-3166 country code |
| `--state <state>` | State or province |
| `--city <city>` | Locality / city |
| `--company <org>` | Organization name |
| `--department <ou>` | Organizational unit |
| `--email <email>` | Email address |
| `--comments <text>` | Version comments |

Both commands also accept `--name <name>` to set a friendly name for the certificate record.

`cert update` additionally supports `--if-unmodified-since <date>` (RFC 3339) for optimistic concurrency control — the update is rejected if the certificate has been modified since the given date.

#### Certificate versions

```bash
cdnpro cert-version get <certId> <version>
cdnpro cert-version delete <certId> <version>
```

### Deployments

```bash
cdnpro deploy list [--from <date>] [--to <date>] [--target <staging|production>]
                   [--status <waiting|inprogress|failed|succeeded>]
                   [--property <id>] [--cert <id>] [--search <keyword>]
                   [--task-ids <id,...>] [--sort-by <field>]
                   [--sort-order <asc|desc>] [--limit <n>] [--offset <n>]
                   [--report-range <scope>] [--all]
cdnpro deploy get <id>
cdnpro deploy create --target <staging|production>
                      (--deploy-property <id@version> | --remove-property <id> |
                       --deploy-cert <id@version> | --remove-cert <id>)...
                      [--name <name>] [--webhook <id>]
                      [--skip-certificate-check] [--skip-client-ca-certificate-check]
                      [--skip-origin-auth-certificate-check] [--skip-usage-check]
                      [--file <path>] [--example]
                      [--wait] [--timeout <seconds>] [--poll-interval <seconds>]
```

`deploy create` requires `--target` plus at least one action flag (`--deploy-property`, `--remove-property`, `--deploy-cert`, or `--remove-cert`), or `--file` to pass the full JSON body.

#### Deploy create flags

**Action flags** (at least one required, all repeatable):

| Flag | Description |
|---|---|
| `--deploy-property <id@version>` | Deploy a property at the specified version |
| `--remove-property <id>` | Remove a property from the target environment |
| `--deploy-cert <id@version>` | Deploy a certificate at the specified version |
| `--remove-cert <id>` | Remove a certificate from the target environment |

**Metadata flags** (optional):

| Flag | Description |
|---|---|
| `--name <name>` | Friendly name for the deployment task |
| `--webhook <id>` | Webhook ID to call on task completion |

**Safety-check bypass flags** (optional):

| Flag | Description |
|---|---|
| `--skip-certificate-check` | Skip certificate validity check |
| `--skip-client-ca-certificate-check` | Skip client CA certificate check |
| `--skip-origin-auth-certificate-check` | Skip origin auth certificate check |
| `--skip-usage-check` | Skip active-hostname safety check |

**File / example flags** (alternative to individual flags):

| Flag | Description |
|---|---|
| `--file <path>` | JSON body file (`-` for stdin) |
| `--example` | Print example body and exit |

**Polling flags** (optional):

| Flag | Description |
|---|---|
| `--wait` | Poll until the deployment succeeds or fails |
| `--timeout <seconds>` | Max wait time (default: 600) |
| `--poll-interval <seconds>` | Poll frequency in seconds (default: 30) |

The `--wait` flag shows a spinner in a TTY and NDJSON progress lines when piped.

### Validation

```bash
cdnpro validation list [--from <date>] [--to <date>] [--property <id>]
                      [--property-version <version>]
                      [--status <waiting|in-progress|failed|succeeded>]
                      [--search <keyword>] [--sort-by <field>]
                      [--sort-order <asc|desc>] [--limit <n>] [--offset <n>]
                      [--report-range <scope>] [--all]
cdnpro validation get <id>
cdnpro validation create --property-id <id> --property-version <version>
                         [--name <name>] [--webhook <id>]
                         [--file <path>] [--example]
                         [--wait] [--timeout <seconds>] [--poll-interval <seconds>]
```

`validation create` requires `--property-id` and `--property-version`, or `--file` to pass the full JSON body.

### Cache Operations

#### Purge

```bash
cdnpro purge list [--from <date>] [--to <date>] [--target <staging|production>]
                  [--action <invalidate|delete>] [--search <keyword>]
                  [--max-success-rate <rate>] [--sort-by <field>]
                  [--sort-order <asc|desc>] [--limit <n>] [--offset <n>]
                  [--report-range <scope>] [--all]
cdnpro purge get <id>
cdnpro purge summary
cdnpro purge tokens
cdnpro purge create --target <staging|production> [--url <url>] [--dir <dir>] [--regex <pattern>] [--wait] [--timeout <seconds>] [--poll-interval <seconds>]
```

#### Prefetch

```bash
cdnpro prefetch list [--from <date>] [--to <date>] [--search <keyword>]
                     [--sort-by <field>] [--sort-order <asc|desc>]
                     [--limit <n>] [--offset <n>] [--report-range <scope>]
                     [--all]
cdnpro prefetch get <id>
cdnpro prefetch tokens
cdnpro prefetch create --url <url> [--name <name>] [--region <region>] [--start-time <datetime>] [--webhook <id>] [--wait] [--timeout <seconds>] [--poll-interval <seconds>]
```

### Edge Hostnames

```bash
cdnpro edge-hostname list [--search <keyword>] [--has-beian]
                          [--server-groups <groups>] [--sort-by <field>]
                          [--sort-order <asc|desc>] [--limit <n>]
                          [--offset <n>] [--report-range <scope>] [--all]
cdnpro edge-hostname get <id>
cdnpro edge-hostname create [--file <path>]
cdnpro edge-hostname update <id> [--file <path>]
cdnpro edge-hostname replace <id> [--file <path>]
cdnpro edge-hostname delete <id>
```

### Hostnames

```bash
cdnpro hostname list [--search <keyword>] [--target <all|staging|production>]
                     [--limit <n>] [--offset <n>] [--report-range <scope>]
                     [--all]
cdnpro hostname get <hostname>
```

```bash
cdnpro hostname-history list [--search <keyword>] [--from <date>] [--to <date>] [--target <staging|production|all>] [--limit <n>] [--offset <n>] [--report-range <scope>] [--all]
cdnpro hostname-history get <hostname> [--from <date>] [--to <date>] [--target <staging|production|all>]
```

### Reports

All report commands require `--from` and `--to` (RFC 3339 UTC dates).

#### Time-series reports

Require `--type <granularity>` (`fiveminutes` | `hourly` | `daily` | `monthly`). Most accept `--hostname`, `--property`, `--property-hostname`, `--server-group` (all repeatable), `--scheme` (`http` | `https` | `all`), and `--report-range`.

```bash
cdnpro report edge-bandwidth --from <date> --to <date> --type <granularity>
cdnpro report edge-volume --from <date> --to <date> --type <granularity>
cdnpro report edge-upload-volume --from <date> --to <date> --type <granularity>
cdnpro report edge-requests --from <date> --to <date> --type <granularity>
cdnpro report edge-status-codes --from <date> --to <date> --type <granularity>
cdnpro report origin-volume --from <date> --to <date> --type <granularity>
cdnpro report origin-requests --from <date> --to <date> --type <granularity>
cdnpro report origin-status-codes --from <date> --to <date> --type <granularity>
cdnpro report interm-volume --from <date> --to <date> --type <granularity>
cdnpro report cpu-time --from <date> --to <date> --type <granularity>
cdnpro report origin-fast-route-requests --from <date> --to <date> --type <granularity>
cdnpro report origin-fast-route-volume --from <date> --to <date> --type <granularity>
cdnpro report l7-volume --from <date> --to <date> --type <granularity>
cdnpro report l7-bandwidth --from <date> --to <date> --type <granularity>
cdnpro report edge-hostname-requests --from <date> --to <date> --type <granularity> [--edge-hostname <h>]
```

#### Summary reports

Do not take `--type`. Most accept the same filters as time-series reports, plus `--group-by` (repeatable, up to 2: `hostnames` | `serverGroups` | `customerIds` | `propertyHostnames` | `legacyTypes`).

```bash
cdnpro report edge-bandwidth-summary --from <date> --to <date>
cdnpro report edge-volume-summary --from <date> --to <date>
cdnpro report edge-requests-summary --from <date> --to <date>
cdnpro report edge-status-summary --from <date> --to <date>
cdnpro report origin-status-summary --from <date> --to <date>
cdnpro report cpu-summary --from <date> --to <date>
cdnpro report l7-volume-summary --from <date> --to <date>
cdnpro report l7-bandwidth-summary --from <date> --to <date>
cdnpro report edge-hostname-requests-summary --from <date> --to <date> [--edge-hostname <h>]
```

#### Log download

Returns download links for raw access logs.

```bash
cdnpro report logs --from <date> --to <date> [--hostname <h>]
# --hostname is repeatable; use --file <path> to pass a full filter body as JSON
```

### Infrastructure & Reference Data

```bash
cdnpro isp list [--search <keyword>] [--region-code <code>]
                [--sort-order <asc|desc>]       # ISP information
cdnpro client-region list [--search <keyword>] [--isp-code <code>]
                          [--sort-order <asc|desc>]  # Client regions
cdnpro shield list [--search <keyword>] [--used-in-properties]
                   [--sort-by <field>] [--sort-order <asc|desc>]
cdnpro shield get <id>                              # Origin shield locations
cdnpro staging-server list            # Staging servers
cdnpro public-ip list                 # Public IPs
cdnpro origin-fast-route-ip list      # Origin fast-route IPs
cdnpro ip-details lookup --file <path>            # IP geolocation details
```

### Configuration & Management

```bash
cdnpro log-config list [--search <keyword>] [--limit <n>] [--offset <n>]
                       [--report-range <scope>] [--all]
cdnpro log-config get|create|update|delete
cdnpro log-aggregation-point list [--search <keyword>]
cdnpro log-aggregation-point get|create|update|delete|summary
cdnpro annotation list [--from <date>] [--to <date>] [--type <client|configuration|operation>]
                       [--search <keyword>] [--limit <n>] [--offset <n>] [--all]
cdnpro annotation get|create|update|delete
cdnpro webhook list [--limit <n>] [--offset <n>] [--report-range <scope>] [--all]
cdnpro webhook get|create|update|delete
cdnpro secret list [--search <keyword>] [--limit <n>] [--offset <n>] [--all]
cdnpro secret get|create|update|delete
cdnpro service-quota list [--search <keyword>] [--status <active|suspended|trial|terminated>]
                          [--allow-production <true|false>]
                          [--advanced-features <features>] [--limit <n>]
                          [--offset <n>] [--report-range <scope>] [--all]
cdnpro service-quota get|update
cdnpro api-permission get|create|update|delete
cdnpro system-config get
```

### Reseller Admin

These commands require a reseller account.

```bash
cdnpro admin customer list [--search <keyword>] [--ids <id,...>]
                           [--status <active|suspended>]
                           [--products <product,...>]
                           [--regional-offices <office,...>]
                           [--sort-by <field>] [--sort-order <asc|desc>]
                           [--limit <n>] [--offset <n>] [--all]
cdnpro admin customer get|create|update
cdnpro admin contact list [--search <keyword>] [--ids <id,...>]
                          [--status <active|suspended|pending>] [--is-master]
                          [--sort-by <field>] [--sort-order <asc|desc>]
                          [--limit <n>] [--offset <n>]
                          [--report-range <scope>] [--all]
cdnpro admin contact get|create|update|delete
cdnpro admin api-account list [--search <keyword>] [--type <operator|read-only>]
                              [--sort-by <field>] [--sort-order <asc|desc>]
                              [--limit <n>] [--offset <n>]
                              [--report-range <scope>] [--all]
cdnpro admin api-account get|create|update|delete
cdnpro admin apicall list [--from <date>] [--to <date>]
                          [--method <GET|POST|PATCH|PUT|DELETE>]
                          [--path <uri>] [--safe <true|false>]
                          [--caller <name-or-id>]
                          [--for-customer <id|none|any>]
                          [--status <code,...>] [--before <apiRequestId>]
                          [--limit <n>] [--report-range <scope>] [--all]
cdnpro admin apicall get
```

### Schema Introspection

Inspect the OpenAPI schema for any operation — useful when building automation or working with AI tools:

```bash
cdnpro schema property list
cdnpro schema deploy create
cdnpro schema purge create
```

The output is a JSON object describing the request and response interface for the operation:

- **Request body schema** — JSON Schema of the request body (for POST/PATCH/PUT)
- **Query parameters** — each parameter annotated with `cliFlag`, `required`, `default`, etc.
- **Request headers** — each header annotated with `cliFlag`, `values`, `description`
- **`bodyCliFlags`** — CLI flags that map to properties in the request body (e.g. `--hostname` → `filters.hostnames` for report commands). Each entry includes the flag name, dot-notation body path, whether it is repeatable, and its description.
- **Response schema** — JSON Schema of the successful response body

This gives AI agents and users a complete picture of every CLI flag available for the operation and exactly where each flag maps in the API request (query string, header, or body).

```bash
# Inspect time-series report flags — shows bodyCliFlags for filter options
$ cdnpro schema report edge-bandwidth
```

Example output for a time-series report showing `cliFlag` on query parameters and `bodyCliFlags` for filter options that map into the request body:

```json
{
  "operation": "getBandwidthReport",
  "method": "POST",
  "path": "/cdn/report/bandwidth",
  "request": {
    "queryParameters": {
      "startdate": { "type": "string", "cliFlag": "--from", "required": true, "description": "Start date (RFC 3339 UTC)" },
      "enddate":   { "type": "string", "cliFlag": "--to",   "required": true, "description": "End date (RFC 3339 UTC)" },
      "type":      { "type": "string", "cliFlag": "--type", "required": true, "description": "Granularity: fiveminutes | hourly | daily | monthly" },
      "scheme":    { "type": "string", "cliFlag": "--scheme", "description": "Traffic type: http | https | all [default: all]" }
    },
    "requestHeaders": {
      "On-Behalf-Of": {
        "cliFlag": "--on-behalf-of",
        "description": "If you are a reseller, specify the ID of a child customer."
      },
      "Report-Range": {
        "cliFlag": "--report-range",
        "description": "Scope: self-only | self+children | children-only [default: self-only]"
      }
    },
    "bodyCliFlags": {
      "filters.hostnames": {
        "cliFlag": "--hostname",
        "repeatable": true,
        "description": "Filter by client-facing hostname; repeatable"
      },
      "filters.propertyIds": {
        "cliFlag": "--property",
        "repeatable": true,
        "description": "Filter by property ID; repeatable"
      },
      "filters.propertyHostnames": {
        "cliFlag": "--property-hostname",
        "repeatable": true,
        "description": "Filter by property hostname pattern; repeatable"
      },
      "filters.serverGroups": {
        "cliFlag": "--server-group",
        "repeatable": true,
        "description": "Filter by server group; repeatable"
      }
    }
  },
  "response": {
    "httpStatus": 200,
    "schema": { "type": "object", "properties": { "data": { "type": "array" } } }
  }
}
```

**Direction flag:** `--direction request|response|both` controls which side of the interface is returned (default: `both`).

### Updating

```bash
cdnpro update             # Check for a newer version and install it
cdnpro update --check     # Check only; exit 1 if an update is available (useful in CI)
cdnpro update --yes       # Update without a confirmation prompt
```

`cdnpro update` detects how the package was installed and runs the right command automatically:

| Install method | Command executed |
|---|---|
| `npm install -g cdnpro-cli` | `npm install -g cdnpro-cli@latest` |
| `npm install cdnpro-cli` (local) | `npm install cdnpro-cli@latest` in project root |
| `yarn add cdnpro-cli` (local) | `yarn add cdnpro-cli@latest` in project root |
| `pnpm add cdnpro-cli` (local) | `pnpm add cdnpro-cli@latest` in project root |
| `npx cdnpro-cli ...` | No update needed — npx always fetches the latest |

When a newer version is available, a one-line notice is printed to stderr after any command completes (interactive terminals only, checked at most once per 24 hours):

```
Notice: cdnpro-cli 2.1.0 is available (you have 2.0.0). Run `cdnpro update` to upgrade.
```

### Shell Completion

```bash
cdnpro completion bash >> ~/.bashrc
cdnpro completion zsh >> ~/.zshrc
cdnpro completion fish > ~/.config/fish/completions/cdnpro.fish
# PowerShell: follow the on-screen instructions from
cdnpro completion powershell
```

## Programmatic Use

Install as a library in your Node.js/TypeScript project:

```bash
npm install /path/to/CDNProCLI-new
```

```typescript
import { CDNProClient } from 'cdnpro-cli';

const client = new CDNProClient({
  host: 'api.cdnetworks.com',
  user: 'your-username',
  secretKey: 'your-secret-key',
});

// List properties
const properties = await client.properties.list();

// Create a deployment
const task = await client.deployments.create({
  target: 'production',
  actions: [
    { action: 'deploy_property', propertyId: 'abc123', version: '2' },
  ],
});

// Poll for completion
let result = await client.deployments.get(task.id);
while (result.status !== 'succeeded' && result.status !== 'failed') {
  await new Promise(r => setTimeout(r, 30_000));
  result = await client.deployments.get(task.id);
}
```

## OpenAPI Spec (`openapi.json`)

`openapi.json` (root of the repo) is the **single source of truth** for the CDN Pro API contract. It drives several layers of the CLI:

| Consumer | How | Where |
|---|---|---|
| **TypeScript types** | `openapi-typescript` reads the spec at build time and emits `src/types/api.ts` | `package.json` `generate:types` script |
| **Request-body validation** | `src/schema/loader.ts` imports the spec at runtime; `src/schema/validate.ts` feeds the extracted JSON Schema to AJV before every POST/PUT/PATCH | All create/update commands |
| **Example body synthesis** | `src/schema/synthesize.ts` walks the spec to produce a filled-in request body for `--example` flags | All create/update commands |
| **Schema introspection** | `src/cli/commands/schema.ts` reads the spec directly to show request/response details for `cdnpro schema <resource> <operation>` | `cdnpro schema` command |
| **CLI flag → API parameter mapping** | Each command file exports an `OptionMapping[]` array that maps CLI flags to their API targets (query params, headers, body properties). `registerMappings()` stores this for schema introspection; `registerOptionsFromMapping()` registers Commander options from the same source. | `src/cli/option-map.ts` + every command file |
| **Bundled artifact** | The spec is imported by `loader.ts`, so `tsc` embeds it inside `dist/` — no separate file copy needed | `npm run build` |

The spec is loaded once and cached in memory the first time any schema function is called; subsequent calls within the same process reuse the cached object.

### After updating `openapi.json`

**End users:** run `cdnpro update`. The published package already includes regenerated types and a prebuilt `dist/`; no manual steps are needed.

**Contributors** working on the source must do the following before publishing a new release:

1. **Regenerate types** — run `npm run generate:types` to overwrite `src/types/api.ts`. Never edit that file by hand; it will be overwritten.
2. **Rebuild** — run `npm run build` so the updated spec is compiled into `dist/`.
3. **Update `OPERATION_MAP`** if you added or removed endpoints — open `src/schema/query.ts` and add/remove entries so the new operations are reachable via `cdnpro schema` and `--example`.
4. **Add `OptionMapping[]`** for any new command — each command file exports its CLI flags as an `OptionMapping[]` array and calls `registerMappings()` so `cdnpro schema` can annotate parameters with `cliFlag` and `bodyCliFlags`. Use shared presets (`PAGINATION_OPTIONS`, `SORT_OPTIONS`, `FILE_EXAMPLE`, `CONFIRM`, etc.) from `src/cli/option-map.ts`.
5. **Run tests** — run `npm test` to catch any type errors or broken validations introduced by the spec change.

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (no compilation needed)
npm run dev -- auth status
npm run dev -- property list

# Generate TypeScript types from openapi.json
npm run generate:types

# Build
npm run build

# Run tests
npm test
```

## See Also

- [CDN Pro product page](https://www.cdnetworks.com/cdnpro)
- [CDN Pro documentation](https://docs.cdnetworks.com)
- [CDN Pro portal](https://console.cdnetworks.com)
- [Legacy bash CLI](cdn/bash/)
- [Legacy JavaScript library](cdn/js/)
