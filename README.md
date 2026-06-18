# CDNPro CLI

A TypeScript-based command-line interface and programmable library for the [CDN Pro API](https://docs.cdnetworks.com) by CDNetworks.

## Features

- Full coverage of CDN Pro REST APIs: properties, certificates, deployments, edge hostnames, cache operations, reports, and more
- Profile-based credential management (multiple environments/accounts)
- Auto-detects output format: human-readable tables in interactive terminals, JSON when piped
- `--wait` flag on async operations (deploys, validations, purges, prefetches) polls until completion
- OpenAPI schema introspection via `cdnpro schema` — useful for AI agents and tooling
- Shell completion for bash, zsh, and fish
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
| `table` | Interactive TTY (default) | Human-readable ASCII table |
| `json` | Piped/non-TTY (default) | Single JSON envelope |
| `jsonl` | Explicit `--output jsonl` | One JSON object per line (streaming) |

## Commands

### Properties

```bash
cdnpro property list [--search <keyword>]
cdnpro property get <id>
cdnpro property create [--file <path>]   # --example prints an example body
cdnpro property update <id> [--file <path>]
cdnpro property delete <id>
```

#### Property versions

```bash
cdnpro property-version list <propertyId>
cdnpro property-version get <propertyId> <version>
cdnpro property-version create <propertyId> [--file <path>]
cdnpro property-version update <propertyId> <version> [--file <path>]
cdnpro property-version delete <propertyId> <version>
```

### Certificates

```bash
cdnpro cert list
cdnpro cert get <id>
cdnpro cert create [--file <path>]
cdnpro cert update <id> [--file <path>]
cdnpro cert delete <id>
cdnpro cert download-csr <id>
```

#### Certificate versions

```bash
cdnpro cert-version get <certId> <version>
cdnpro cert-version delete <certId> <version>
```

### Deployments

```bash
cdnpro deploy list
cdnpro deploy get <id>
cdnpro deploy create [--file <path>] [--wait] [--timeout <seconds>] [--poll-interval <seconds>]
```

The `--wait` flag polls until the deployment succeeds or fails. Shows a spinner in a TTY and NDJSON progress lines when piped.

### Validation

```bash
cdnpro validation list
cdnpro validation get <id>
cdnpro validation create [--file <path>] [--wait]
```

### Cache Operations

#### Purge

```bash
cdnpro purge list
cdnpro purge get <id>
cdnpro purge summary
cdnpro purge tokens
cdnpro purge create --target <staging|production> [--url <url>] [--dir <dir>] [--regex <pattern>] [--wait]
```

#### Prefetch

```bash
cdnpro prefetch list
cdnpro prefetch get <id>
cdnpro prefetch tokens
cdnpro prefetch create --target <staging|production> [--url <url>] [--wait]
```

### Edge Hostnames

```bash
cdnpro edge-hostname list
cdnpro edge-hostname get <id>
cdnpro edge-hostname create [--file <path>]
cdnpro edge-hostname update <id> [--file <path>]
cdnpro edge-hostname replace <id> [--file <path>]
cdnpro edge-hostname delete <id>
```

### Hostnames

```bash
cdnpro hostname list [--search <keyword>]
cdnpro hostname get <hostname>
```

```bash
cdnpro hostname-history list [--search <keyword>] [--from <date>] [--to <date>] [--target <staging|production|all>]
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
cdnpro isp list                       # ISP information
cdnpro client-region list             # Client regions
cdnpro shield list|get                    # Origin shield locations
cdnpro staging-server list            # Staging servers
cdnpro public-ip list                 # Public IPs
cdnpro origin-fast-route-ip list      # Origin fast-route IPs
cdnpro ip-details lookup --file <path>            # IP geolocation details
```

### Configuration & Management

```bash
cdnpro log-config list|get|create|update|delete
cdnpro log-aggregation-point list|get|create|update|delete|summary
cdnpro annotation list|get|create|update|delete
cdnpro webhook list|get|create|update|delete
cdnpro secret list|get|create|update|delete
cdnpro service-quota list|get
cdnpro api-permission list|get|create|update|delete
cdnpro system-config get
```

### Reseller Admin

These commands require a reseller account.

```bash
cdnpro admin customer list|get|create|update
cdnpro admin contact list|get|create|update|delete
cdnpro admin api-account list|get|create|update|delete
cdnpro admin apicall list|get
```

### Schema Introspection

Inspect the OpenAPI schema for any operation — useful when building automation or working with AI tools:

```bash
cdnpro schema property list
cdnpro schema deploy create
cdnpro schema purge create
```

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
| **Bundled artifact** | The spec is imported by `loader.ts`, so `tsc` embeds it inside `dist/` — no separate file copy needed | `npm run build` |

The spec is loaded once and cached in memory the first time any schema function is called; subsequent calls within the same process reuse the cached object.

### After updating `openapi.json`

**End users:** run `cdnpro update`. The published package already includes regenerated types and a prebuilt `dist/`; no manual steps are needed.

**Contributors** working on the source must do the following before publishing a new release:

1. **Regenerate types** — run `npm run generate:types` to overwrite `src/types/api.ts`. Never edit that file by hand; it will be overwritten.
2. **Rebuild** — run `npm run build` so the updated spec is compiled into `dist/`.
3. **Update `OPERATION_MAP`** if you added or removed endpoints — open `src/schema/query.ts` and add/remove entries so the new operations are reachable via `cdnpro schema` and `--example`.
4. **Run tests** — run `npm test` to catch any type errors or broken validations introduced by the spec change.

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
