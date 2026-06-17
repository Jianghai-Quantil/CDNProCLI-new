# CDNProCLI Code Review

> Generated: 2026-06-17  
> Scope: `src/` (ignoring legacy `/cdn/` folder)  
> Reviewer: Claude (Sonnet 4.6) via Claude Code

---

## How to Use This File

Each issue below includes:
- **File + line reference** for exact navigation
- **Severity** label (Critical / High / Medium / Low)
- **Category** (Bug / Security / Inconsistency / Minor)
- A **fix suggestion** in the description

Use one issue per Claude session prompt: "Fix issue #N in CODE_REVIEW.md."

---

## Issue Index

| # | Sev | Category | File | Title |
|---|-----|----------|------|-------|
| 1 | Critical | Bug | ApiCore.ts:158 | Leading space in Authorization header value |
| 2 | ~~Critical~~ | ~~Bug~~ | ApiCore.ts:151-158 | ~~Auth scheme mismatch: comments say `sha1`, code sends `Basic`~~ — **RESOLVED: code is correct; Basic Auth with HMAC-SHA1 password derivation is the intended scheme; no misleading comments exist** |
| 3 | Critical | Bug | ApiCore.ts:266-270 | UTF-8 corruption when TCP chunks split multi-byte characters |
| 4 | Critical | Bug | ApiCore.ts:303-307 | Timeout rejects promise but does not destroy socket → leak |
| 5 | ~~High~~ | ~~Bug~~ | errors.ts:45-55 | ~~HTTP 400 maps to exit 1 (ERROR) instead of exit 4 (VALIDATION)~~ — **RESOLVED** |
| 6 | ~~High~~ | ~~Bug~~ | multiple | ~~`parseInt` result not validated — NaN sent to API as query param~~ — **RESOLVED** |
| 7 | High | Security | config.ts:147-151 | `process.stdout.write` monkey-patched globally in `promptInput` |
| 8 | Medium | Bug | wait.ts:44-60 | `poll` event emitted even when first poll already shows `succeeded` |
| 9 | ~~Medium~~ | ~~Bug~~ | purge/create.ts:37-38 | ~~`--dir` (max 20) and `--regex` (max 2) limits documented but not enforced~~ — **RESOLVED** |
| 10 | ~~Medium~~ | ~~Bug~~ | output.ts:128-130 | ~~`buildMeta()` wraps single-object response in a 1-element array~~ — **RESOLVED** |
| 11 | ~~Medium~~ | ~~Bug~~ | auth.ts:47-49 | ~~`auth login` default-profile logic reads store after write — off-by-one~~ — **RESOLVED** |
| 12 | Medium | Security | cert/create.ts:47-64 | AES IV and key derived from same HMAC output; IV is not random |
| 13 | Medium | Security | ApiCore.ts:226-228 | No response body size cap — memory exhaustion via large responses |
| 14 | Medium | Inconsistency | ApiCore.ts:57-59 | `isPlainObject` too broad — accepts class instances, Map, Date, etc. |
| 15 | ~~Medium~~ | ~~Inconsistency~~ | CDNProClient.ts | ~~Log config operations on `Report` class instead of a dedicated resource~~ — **RESOLVED** |
| 16 | ~~Low~~ | ~~Bug~~ | main.ts:42 | ~~Version hardcoded as `'2.0.0'` instead of reading from `package.json`~~ — **RESOLVED** |
| 17 | ~~Low~~ | ~~Bug~~ | synthesize.ts:20 | ~~No circular `$ref` guard — infinite recursion on cyclic schemas~~ — **RESOLVED** |
| 18 | ~~Low~~ | ~~Bug~~ | validate.ts:32-33 | ~~AJV singleton `errors` array not immediately captured — fragile~~ — **RESOLVED** |
| 19 | Low | Inconsistency | query.ts:44-45 | Schema key `hostname.history-get` not discoverable via `cdnpro schema hostname history get` |
| 20 | ~~Low~~ | ~~Inconsistency~~ | Properties.ts:56-65 | ~~`updateVersion` (PUT) has no CLI command and no OPERATION_MAP entry~~ — **RESOLVED** |
| 21 | Low | Security | ApiCore.ts:175 | `debug` field typed as `unknown` is String()-coerced into request header |
| 22 | Low | Minor | ApiCore.ts:303 | 30-second request timeout is hardcoded with no user override |
| 23 | ~~Low~~ | ~~Minor~~ | completion.ts:350 | ~~Non-null assertion `SUBCMDS['report']!` in bash completion template~~ — **RESOLVED** |

---

## Detailed Findings

---

### Issue 1 — Critical Bug
**Leading space in Authorization header value**  
File: [`src/client/ApiCore.ts:158`](src/client/ApiCore.ts#L158)

**Code:**
```typescript
Authorization: ` Basic ${authData}`,
//             ^ spurious leading space
```

**Problem:**  
The template literal starts with a backtick-space, so the actual header value is `" Basic abc..."` instead of `"Basic abc..."`. RFC 7235 §2.1 requires the scheme to appear immediately after the colon—some servers reject or fail to parse credentials when the value has leading whitespace. This will silently break authentication on any server that does not trim the header value.

**Fix:**  
Remove the leading space:
```typescript
Authorization: `Basic ${authData}`,
```

---

### Issue 2 — ~~Critical Bug~~ RESOLVED (Not a Bug)
**Auth scheme: Basic Auth with HMAC-SHA1 password derivation is correct and intentional**  
File: [`src/client/ApiCore.ts:151-158`](src/client/ApiCore.ts#L151-L158)

**Status:** Code is correct. The server expects `Authorization: Basic base64(user:HMAC-SHA1-digest)`. There are no misleading comments in the source code or README that claim a `sha1` custom scheme. No action required.

---

### Issue 3 — Critical Bug
**UTF-8 corruption when TCP chunks split multi-byte characters**  
File: [`src/client/ApiCore.ts:266-270`](src/client/ApiCore.ts#L266-L270)

**Code:**
```typescript
res.on('data', (chunk: Buffer) => {
  len += chunk.length;
  if (uncomp) uncomp.write(chunk);
  else data += chunk;        // ← coerces each Buffer to string individually
});
```

**Problem:**  
`data += chunk` calls `chunk.toString('utf8')` on *each* network chunk independently. If a multi-byte UTF-8 character (e.g., a 3-byte Chinese glyph or 4-byte emoji) is split across two TCP packets, the first packet produces a replacement character U+FFFD and the second produces garbage. JSON with corrupted Unicode then fails to parse silently (the try/catch around `JSON.parse` swallows the error and returns the raw string).

**Fix:**  
Collect all chunks as raw `Buffer`s and decode once at the end:
```typescript
const chunks: Buffer[] = [];
res.on('data', (chunk: Buffer) => {
  len += chunk.length;
  if (uncomp) uncomp.write(chunk);
  else chunks.push(chunk);
});
// In finalProc():
const data = Buffer.concat(chunks).toString('utf8');
```
(The decompressed path already handles this correctly via zlib streaming.)

---

### Issue 4 — Critical Bug
**Timeout handler calls `reject()` but does not destroy the socket — file descriptor leak**  
File: [`src/client/ApiCore.ts:303-307`](src/client/ApiCore.ts#L303-L307)

**Code:**
```typescript
request.setTimeout(30000, () => {
  const err: ApiError = new Error('Request timed out after 30 seconds.');
  err.ctx = ctx as ResponseContext;
  reject(err);
  // ← socket is never closed
});
```

**Problem:**  
`request.setTimeout()` fires a callback when the socket is idle for 30 seconds, but calling `reject()` alone does *not* close the underlying TCP connection. The socket (and its file descriptor) remains open until the OS-level timeout, which may be minutes. Under high load or in long-running processes, this can exhaust the connection pool (max 256 sockets) and deplete system file descriptors.

**Fix:**  
Destroy the request after rejecting:
```typescript
request.setTimeout(30000, () => {
  const err: ApiError = new Error('Request timed out after 30 seconds.');
  err.ctx = ctx as ResponseContext;
  request.destroy(err);
  reject(err);
});
```

---

### Issue 5 — High Bug
**HTTP 400 maps to exit code 1 (`ERROR`) instead of exit code 4 (`VALIDATION`)**  
File: [`src/cli/errors.ts:45-55`](src/cli/errors.ts#L45-L55)

**Code:**
```typescript
function httpStatusToCode(status: number | undefined): ExitCodeKey {
  switch (true) {
    case status === 401: return 'AUTH_ERROR';
    case status === 403: return 'FORBIDDEN';
    case status === 404: return 'NOT_FOUND';
    case status === 412: return 'PRECONDITION_FAILED';
    case status === 429: return 'RATE_LIMITED';
    case (status ?? 0) >= 500: return 'SERVER_ERROR';
    default: return 'ERROR';   // ← 400 falls here
  }
}
```

**Problem:**  
A server-side validation failure returns HTTP 400. The CLI maps this to exit code 1 (`ERROR`). But local validation failures (caught before the request is even sent) correctly use exit code 4 (`VALIDATION`). Scripts that check `$?` to detect validation problems get different exit codes for local vs server-side failures, making programmatic error handling unreliable.

**Fix:**  
Add a case for 400:
```typescript
case status === 400: return 'VALIDATION';
```

---

### Issue 6 — ~~High Bug~~ RESOLVED
**`parseInt` results validated — NaN guarded with clear client-side error**  
Files:
- [`src/cli/commands/property/list.ts:69-70`](src/cli/commands/property/list.ts#L69-L70)
- [`src/cli/commands/deploy/create.ts:155-156`](src/cli/commands/deploy/create.ts#L155-L156)
- [`src/cli/commands/purge/create.ts:120-121`](src/cli/commands/purge/create.ts#L120-L121)
- [`src/cli/commands/prefetch/create.ts` — timeout/pollInterval]
- [`src/cli/commands/validation/create.ts:61-62`](src/cli/commands/validation/create.ts#L61-L62)
- [`src/cli/commands/hostname/history.ts:74-75`](src/cli/commands/hostname/history.ts#L74-L75)

**Status:** Fixed. All `parseInt` calls now use nullish coalescing to supply defaults before parsing, and every result is validated with `isNaN` / range checks. Invalid input now throws a `CliError('VALIDATION', ...)` with a descriptive message before any API call is made.

---

### Issue 7 — High Security
**`process.stdout.write` monkey-patched globally in `promptInput(silent=true)`**  
File: [`src/cli/config.ts:147-151`](src/cli/config.ts#L147-L151)

**Code:**
```typescript
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = () => true;    // ← global override

rl.once('line', (line) => {
  process.stdout.write = origWrite;   // ← only restored on success
  // ...
});
```

**Problem:**  
1. `process.stdout.write` is permanently replaced for the entire process while the prompt waits for input. If an exception is thrown before the `'line'` event fires (e.g., `stdin` closes, readline emits `'close'`), `stdout` remains suppressed for the rest of the process lifetime and all subsequent output is silently swallowed.
2. The override is not async-safe: any concurrent activity that writes to stdout between the patch and the restore will have its output suppressed without warning.
3. The `readline.createInterface({ terminal: false })` option combined with the stdout patch is the wrong idiom—readline's built-in echo suppression should be used instead.

**Fix:**  
Use readline's own `output: null` trick or `mute-stream` (which is what `inquirer` uses):
```typescript
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});
// Suppress echo by creating a muted output stream, not patching the global
```
Or at minimum wrap the restoration in a `try/finally`:
```typescript
rl.once('line', (line) => {
  process.stdout.write = origWrite;
  process.stdout.write('\n');
  rl.close();
  resolve(line);
});
rl.once('close', () => {
  process.stdout.write = origWrite; // restore on close too
});
```

---

### Issue 8 — Medium Bug
**`waitForTask` emits a `poll` event even when the first check already shows `succeeded`**  
File: [`src/cli/wait.ts:44-60`](src/cli/wait.ts#L44-L60)

**Code:**
```typescript
// Always emits poll first...
process.stdout.write(
  JSON.stringify({ event: 'poll', taskId, status, progressPercent: pct }) + '\n',
);

if (status === 'succeeded') {
  // ...then emits done
  process.stdout.write(
    JSON.stringify({ event: 'done', taskId, data: task }) + '\n',
  );
  return task;
}
```

**Problem:**  
Fast operations (validation on a single property, small purges) may complete before the first poll. Consumers get two events: `{event:"poll", status:"succeeded"}` immediately followed by `{event:"done"}`. A consumer that stops processing after the first `done` event never parses the preceding `poll` events that also have `status="succeeded"`, creating ambiguity about when the task actually finished.

**Fix:**  
Emit `done` instead of `poll` when the status is already terminal on first check:
```typescript
if (status === 'succeeded') {
  // ...emit done, skip the poll emission
  return task;
}
if (status === 'failed') { ... }
// Only emit poll for non-terminal states
process.stdout.write(
  JSON.stringify({ event: 'poll', taskId, status, progressPercent: pct }) + '\n',
);
```

---

### Issue 9 — ~~Medium Bug~~ RESOLVED
**`--dir` and `--regex` limits are now enforced client-side**  
File: [`src/cli/commands/purge/create.ts:37-38`](src/cli/commands/purge/create.ts#L37-L38)

**Status:** Fixed. Guards added after the existing "at least one required" check:
```typescript
if (dirs.length > 20) {
  throw new CliError('VALIDATION', `--dir accepts at most 20 entries, got ${dirs.length}`);
}
if (regexes.length > 2) {
  throw new CliError('VALIDATION', `--regex accepts at most 2 entries, got ${regexes.length}`);
}
```
Exceeding either limit now produces an actionable `VALIDATION` error (exit code 4) before any API call is made.

---

### Issue 10 — ~~Medium Bug~~ RESOLVED
**`buildMeta()` single-object responses no longer wrapped in a 1-element array**  
File: [`src/cli/output.ts:128-130`](src/cli/output.ts#L128-L130)

**Status:** Fixed. The single-resource branch now returns `{ items: [], meta, single: rawData }` instead of `{ items: [rawData], meta }`. The return type is updated to include the optional `single?: unknown` field. Callers that render lists use `items` as before; if an unexpected single-object response is received, `single` carries the object for direct rendering rather than producing a malformed 1-row table.

---

### Issue 11 — ~~Medium Bug~~ RESOLVED
**`auth login` default-profile logic reads the store *before* saving — correctly detects first profile**  
File: [`src/cli/commands/auth.ts:47-49`](src/cli/commands/auth.ts#L47-L49)

**Status:** Fixed. `listProfiles()` is now called *before* `saveProfile()` to capture the pre-save count. `isFirstProfile` is `true` only when the store was empty before the write, accurately reflecting "this is the first profile added." The previous code read the count after saving, so a fresh install always saw `length === 1` (the profile just written) — coincidentally correct but semantically wrong for any overwrite scenario where the store already had exactly one entry.

---

### Issue 12 — Medium Security
**Private key encryption: AES IV and key derived from the same HMAC output; IV is deterministic**  
File: [`src/cli/commands/cert/create.ts:47-64`](src/cli/commands/cert/create.ts#L47-L64)

**Code:**
```typescript
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(dateStr);
const hexDigest = hmac.digest('hex');       // 64 hex chars = 32 bytes

const ivHex  = hexDigest.substring(0, 32); // bytes 0-15 → IV
const keyHex = hexDigest.substring(32, 64);// bytes 16-31 → AES key
```

**Problems:**
1. **IV is not random.** The AES IV should be unpredictable. Here it is deterministic: two uploads within the same UTC second with the same account will produce an identical (IV, key) pair, making ciphertext comparison possible.
2. **IV and key are derived from the same secret material.** NIST recommends that IVs and keys be independent. Splitting a single HMAC output into two halves does not provide that independence.
3. **`dateStr` is captured at line 142 but the HTTP request executes later.** If the `Date:` header (used for server-side HMAC verification) drifts even slightly from the `dateStr` embedded in the AES key derivation, cert-upload authentication will fail silently.

**Fix:**  
Use a random IV and derive the key independently:
```typescript
const iv = crypto.randomBytes(16);
const key = crypto.createHash('sha256').update(secretKey + dateStr).digest().slice(0, 16);
const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
const encrypted = Buffer.concat([iv, cipher.update(...), cipher.final()]);
// Prepend IV to ciphertext so the server can decrypt it
```

---

### Issue 13 — Medium Security
**No response body size cap — a large server response exhausts RAM**  
File: [`src/client/ApiCore.ts:226-228`](src/client/ApiCore.ts#L226-L228)

**Problem:**  
The response body is accumulated in an unbounded string (or decompressed buffer). A malicious or misconfigured API host can stream a gigabyte-scale response and exhaust the Node.js heap with no protection.

**Fix:**  
Add a configurable `maxBodyBytes` limit (e.g., 64 MB default) and reject with an error if exceeded:
```typescript
const MAX_BODY = 64 * 1024 * 1024; // 64 MB
res.on('data', (chunk: Buffer) => {
  len += chunk.length;
  if (len > MAX_BODY) {
    request.destroy(new Error(`Response too large (> ${MAX_BODY} bytes)`));
    return;
  }
  // ...
});
```

---

### Issue 14 — Medium Inconsistency
**`isPlainObject` is too broad — accepts class instances, Map, Set, Date, etc.**  
File: [`src/client/ApiCore.ts:57-59`](src/client/ApiCore.ts#L57-L59)

**Code:**
```typescript
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}
```

**Problem:**  
This returns `true` for `new Date()`, `new Map()`, class instances, etc. If a caller accidentally passes one of these as a request body, `JSON.stringify` silently produces `{}` (for Map), `"2026-01-01T00:00:00.000Z"` (for Date), or a partial serialization (for class instances), rather than throwing a helpful error.

**Fix:**  
Use prototype-based check:
```typescript
function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
```

---

### Issue 15 — ~~Medium Inconsistency~~ RESOLVED
**Log config operations extracted to a dedicated `LogConfigs` resource class**  
Files: [`src/client/resources/LogConfigs.ts`](src/client/resources/LogConfigs.ts) + [`src/client/CDNProClient.ts`](src/client/CDNProClient.ts) + [`src/client/resources/Report.ts`](src/client/resources/Report.ts)

**Status:** Fixed. `listLogConfigs`, `createLogConfig`, `getLogConfig`, `updateLogConfig`, and `deleteLogConfig` have been removed from `Report` and extracted into a new `LogConfigs` class (analogous to `LogAggregationPoints`). `CDNProClient` now exposes `client.logConfigs` with the standard `list`, `get`, `create`, `update`, `delete` methods. All CLI `log-config` commands updated accordingly.

---

### Issue 16 — ~~Low Bug~~ RESOLVED
**Version string now read dynamically from `package.json` via `CURRENT_VERSION`**  
File: [`src/cli/main.ts:41`](src/cli/main.ts#L41)

**Status:** Fixed. `CURRENT_VERSION` (already exported from `updater.ts`, which walks up the directory tree to find and read `package.json` at runtime) is now imported in `main.ts` and passed to `.version()`. Bumping the version in `package.json` is all that is needed — `cdnpro --version` will reflect it without any manual change to `main.ts`.

---

### Issue 17 — ~~Low Bug~~ RESOLVED
**Circular `$ref` guard added to `synthesizeFromSchema`**  
File: [`src/schema/synthesize.ts:20`](src/schema/synthesize.ts#L20)

**Status:** Fixed. A `_seen` `Set<string>` is threaded through all recursive calls. Before resolving any `$ref`, the ref path is checked against `_seen`; if already present, synthesis returns the sentinel string `<recursive:<ref>>` immediately rather than recursing. After checking, the ref is added to `_seen` so any descendant that circles back is caught. All internal recursive calls (`object` properties, `array` items) forward the same `_seen` set, so cycles anywhere in the schema graph are detected.

---

### Issue 18 — ~~Low Bug~~ RESOLVED
**AJV singleton `errors` array is now immediately captured into an independent copy**  
File: [`src/schema/validate.ts:32-33`](src/schema/validate.ts#L32-L33)

**Status:** Fixed. `ajv.errors` is now spread into a fresh array immediately after `ajv.validate()` returns, before the function exits:
```typescript
const valid = ajv.validate(schema as object, body) as boolean;
const errors = ajv.errors ? [...ajv.errors] : [];
return { valid, errors, schema };
```
The returned `errors` array is independent of the AJV instance, so any subsequent call that overwrites `ajv.errors` cannot affect already-returned results.

---

### Issue 19 — Low Inconsistency
**Schema key `hostname.history-get` is not discoverable through the natural CLI path**  
File: [`src/schema/query.ts:44-45`](src/schema/query.ts#L44-L45)

**Code:**
```typescript
'hostname.history':     { method: 'get', path: '/cdn/hostnames/historical' },
'hostname.history-get': { method: 'get', path: '/cdn/hostnames/historical/{hostname}' },
```

**Problem:**  
The CLI structure is `cdnpro hostname history get <hostname>`, with `history` as a subcommand group and `get` as its child. Users would naturally try `cdnpro schema hostname history get` to inspect the schema, but that string does not match any key—the key is `hostname.history-get` (hyphenated). `cdnpro schema hostname history` works for the list operation but `cdnpro schema hostname history-get` is unintuitive.

**Fix:**  
Rename the key for consistency:
```typescript
'hostname.history-list': { method: 'get', path: '/cdn/hostnames/historical' },
'hostname.history-get':  { method: 'get', path: '/cdn/hostnames/historical/{hostname}' },
```
And add documentation to `schema` command help explaining the `resource.operation` key convention for nested commands.

---

### Issue 20 — ~~Low Inconsistency~~ RESOLVED
**`Properties.updateVersion` (PUT) removed — API does not expose a PUT endpoint for property versions**  
File: [`src/client/resources/Properties.ts`](src/client/resources/Properties.ts)

**Status:** Fixed. `updateVersion` (which issued a `PUT` request) has been removed from `Properties`. The API does not expose a `PUT /cdn/properties/{propertyID}/versions/{version}` endpoint, so the method was dead code that could never succeed. The only supported version-update operation remains `patchVersion` (PATCH), which is what the `property version update` CLI command calls.

---

### Issue 21 — Low Security
**`debug` field on `RequestOptions` is `unknown` and gets `String()`-cast into a request header**  
File: [`src/client/ApiCore.ts:175`](src/client/ApiCore.ts#L175)

**Code:**
```typescript
if (options.debug != null) out.headers['x-debug'] = String(options.debug);
```

**Problem:**  
The `debug` field is typed as `unknown`. Library consumers who accidentally assign a structured object (e.g., `{ credentials: ... }`) to `debug` will have it `String()`'d (producing `"[object Object]"`) and sent to the server in a request header. While the information is not useful in this form, the intent to send a debug value is unclear, the field is undocumented, and it could confuse server-side log analysis.

**Fix:**  
Narrow the type to `string | undefined`, remove the field if it's internal-only, or document its intended use clearly.

---

### Issue 22 — Low Minor
**30-second HTTP request timeout is hardcoded with no override**  
File: [`src/client/ApiCore.ts:303`](src/client/ApiCore.ts#L303)

**Problem:**  
Large certificate PEM file uploads or slow cross-continent connections may legitimately exceed 30 seconds. There is no `RequestOptions.timeout` field to override this. Currently all operations silently fail if they take more than 30 seconds, even though the polling commands allow per-operation timeout overrides.

**Fix:**  
Add an optional `timeout` field to `RequestOptions` (default 30000) and pass it through:
```typescript
const timeoutMs = options.timeout ?? 30_000;
request.setTimeout(timeoutMs, () => { ... });
```

---

### Issue 23 — ~~Low Minor~~ RESOLVED
**Non-null assertion on `SUBCMDS['report']` replaced with safe fallback**  
File: [`src/cli/commands/completion.ts:351`](src/cli/commands/completion.ts#L351)

**Status:** Fixed. `SUBCMDS['report']!.join(' ')` replaced with `(SUBCMDS['report'] ?? []).join(' ')`. If `SUBCMDS['report']` were ever removed or renamed, the completion script now degrades gracefully (empty word list) rather than throwing `TypeError: Cannot read properties of undefined`.

---

## Additional Observations (Not Bugs, Worth Noting)

- **No retry logic on transient failures (429, 503).** The CLI exits immediately on rate-limiting. Automated pipelines will need to implement their own retry wrapper around the CLI or use the library directly.

- **`--all` auto-pagination emits JSONL to stdout regardless of `--output` flag.** The flag is quietly overridden, which is documented in the help text but could surprise library consumers.

- **`node-forge` is listed as a dependency** in `package.json` but does not appear to be used anywhere in `src/`. It may be a leftover from an earlier design. Removing unused dependencies reduces attack surface.

- **`diff` is listed as a dependency** in `package.json` but also does not appear to be used in `src/`. Same recommendation as above.

- **`xml2js` is listed as a dependency** but no XML parsing is evident in the reviewed source. Confirm or remove.

- **`openapi.json` is bundled with the package** and loaded via `import ... from '../../openapi.json'`. For large specs this inflates the package size and startup memory. Consider lazy-loading the spec only when the `schema` command or `--example` is used.

- **`emitValidationError` calls `process.exit()`** inside a function, making it untestable and surprising for library users who `import { validateBody }` and expect thrown errors rather than hard exits.

- **Time-series report commands check `--from`, `--to`, `--type` redundantly**: `requiredOption` in commander already prevents the command from running without them, yet `time-series.ts:76` re-checks `if (!opts.from || !opts.to || !opts.type)` and throws. The duplicate check is harmless but misleading.
