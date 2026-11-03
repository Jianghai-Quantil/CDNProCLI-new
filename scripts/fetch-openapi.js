#!/usr/bin/env node
'use strict';

/**
 * Downloads the CDN Pro OpenAPI spec to <repo>/openapi.json.
 *
 * The spec is not committed to this repo. It is fetched at build time from the
 * docs-content-cdn repo (the single source of truth) and git-ignored.
 *
 * Sources, tried in order (the one that produced the current file goes first):
 *   1. raw.githubusercontent.com            (primary)
 *   2. api.github.com contents API          (failover, same file via the raw media type)
 * If a source is unreachable, times out, errors, or returns something that is not an
 * OpenAPI document, the next one is tried.
 *   Not used: the github.com ".../blob/..." page. It does return an ETag, but for the
 *   HTML page, not the file, and it contains no file body (too large for GitHub to
 *   render), so it cannot supply the spec. ".../raw/..." just redirects to source 1.
 *
 * ETag: the server's ETag is saved next to the spec (openapi.json.etag, git-ignored)
 * together with the URL it came from, and sent back as If-None-Match on later runs, so
 * the file is only re-downloaded when it changed upstream (HTTP 304 = still up to date).
 * ETags are source-specific (weak per-encoding on raw; the git blob SHA on the API), so
 * a saved ETag is only ever sent to the source that issued it.
 *
 * Usage:
 *   node scripts/fetch-openapi.js            download if missing, or if upstream changed (ETag)
 *   node scripts/fetch-openapi.js --force    always re-download, ignoring the saved ETag
 *
 * Environment:
 *   OPENAPI_SPEC_URL   override the primary source. Both raw.githubusercontent.com URLs and
 *                      github.com/<owner>/<repo>/blob/<ref>/<path> URLs are accepted
 *                      (the latter is rewritten to the raw form). The api.github.com
 *                      failover is derived from it when it is a GitHub URL (the ref must be
 *                      a single path segment, e.g. "master").
 *   GITHUB_TOKEN       (or GH_TOKEN) optional. Sent to api.github.com only, to lift the
 *                      60 requests/hour unauthenticated limit (304 responses count too).
 *
 * Failure behaviour (after every source has failed):
 *   - openapi.json already exists  -> warn and keep the existing copy (exit 0)
 *   - openapi.json does not exist  -> print a clear error and exit 1
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_URL =
  'https://raw.githubusercontent.com/mileweb/docs-content-cdn/master/en/apispec/openapi.json';
const DOWNLOAD_TIMEOUT_MS = 30_000;
// When we already have a copy, an update check must never stall a build for long.
const CHECK_TIMEOUT_MS = 10_000;
const USER_AGENT = 'cdnpro-cli-fetch-openapi';

const dest = path.join(__dirname, '..', 'openapi.json');
const etagFile = `${dest}.etag`;
const force = process.argv.includes('--force');
const log = (msg) => console.log(`[fetch-openapi] ${msg}`);

/** Turn a github.com "blob" page URL into the raw-content URL; leave anything else alone. */
function toRawUrl(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : url;
}

/**
 * The ordered list of places to try. Always the primary; plus the GitHub API when the
 * primary is a raw.githubusercontent.com URL we can translate.
 */
function buildSources(primaryUrl) {
  const sources = [
    {
      name: new URL(primaryUrl).host,
      url: primaryUrl,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    },
  ];

  const m = primaryUrl.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (m) {
    const [, owner, repo, ref, filePath] = m;
    const headers = {
      // The raw media type returns the file itself (up to 100 MB), not the JSON wrapper.
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': USER_AGENT,
    };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    sources.push({
      name: 'api.github.com',
      url: `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
      headers,
    });
  }
  return sources;
}

function describe(err) {
  const cause = err && err.cause && (err.cause.code || err.cause.message);
  const base = err && err.name === 'TimeoutError' ? 'timed out' : err && err.message ? err.message : String(err);
  return cause ? `${base} (${cause})` : String(base);
}

/** Write via a temp file so an interrupted run never leaves a half-written file behind. */
function writeAtomic(file, contents) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
}

/**
 * The saved { url, etag } record, or null if there is none / it is unreadable / the spec
 * file itself is missing (an ETag is meaningless without the file it describes).
 */
function readSavedRecord() {
  if (!fs.existsSync(dest) || !fs.existsSync(etagFile)) return null;
  try {
    const saved = JSON.parse(fs.readFileSync(etagFile, 'utf8'));
    return saved && typeof saved.url === 'string' && typeof saved.etag === 'string' && saved.etag ? saved : null;
  } catch {
    return null; // corrupt sidecar: just do a full download
  }
}

function saveRecord(url, etag) {
  if (etag) {
    writeAtomic(etagFile, JSON.stringify({ url, etag }) + '\n');
  } else {
    fs.rmSync(etagFile, { force: true }); // server sent no ETag: don't keep a stale one
  }
}

/**
 * Fetches one source. Resolves to { notModified: true } on HTTP 304, otherwise
 * { text, spec, etag } for a validated OpenAPI document. Rejects on anything else.
 */
async function download(source, etag) {
  if (typeof fetch !== 'function') {
    throw new Error(`global fetch() is not available in Node ${process.version}; Node 18+ is required`);
  }
  const headers = { ...source.headers };
  if (etag) headers['If-None-Match'] = etag;

  const res = await fetch(source.url, {
    headers,
    signal: AbortSignal.timeout(fs.existsSync(dest) ? CHECK_TIMEOUT_MS : DOWNLOAD_TIMEOUT_MS),
  });
  if (res.status === 304) return { notModified: true };
  if (res.status === 401 && headers.Authorization) {
    // A stale/revoked GITHUB_TOKEN in the environment must not break an otherwise-working
    // anonymous request: retry once without credentials.
    log(`${source.name} rejected the token (HTTP 401); retrying without it`);
    const { Authorization, ...anonymous } = source.headers;
    return download({ ...source, headers: anonymous }, etag);
  }
  if (!res.ok) {
    if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new Error(`HTTP ${res.status}: rate limit exceeded (set GITHUB_TOKEN to raise it)`);
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
  }

  const text = await res.text();
  let spec;
  try {
    spec = JSON.parse(text);
  } catch {
    // e.g. a captive portal / proxy error page served with HTTP 200, or a truncated body
    const looksHtml = /^\s*</.test(text);
    throw new Error(`response is not valid JSON${looksHtml ? ' (looks like an HTML page, e.g. a captive portal or proxy)' : ''}`);
  }
  if (!spec || typeof spec !== 'object' || typeof spec.paths !== 'object') {
    throw new Error('response is not an OpenAPI document (no "paths" object)');
  }
  return { text, spec, etag: res.headers.get('etag') };
}

function countOperations(spec) {
  const verbs = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];
  return Object.values(spec.paths).reduce(
    (n, item) => n + verbs.filter((v) => item && item[v]).length,
    0,
  );
}

async function main() {
  const primaryUrl = toRawUrl(process.env.OPENAPI_SPEC_URL || DEFAULT_URL);
  const saved = force ? null : readSavedRecord();

  // Try the source that produced the current file first: its ETag is the only one that can
  // yield a cheap 304, and it avoids waiting on a primary that is known to be unreachable.
  const sources = buildSources(primaryUrl).sort(
    (a, b) => Number(Boolean(saved) && b.url === saved.url) - Number(Boolean(saved) && a.url === saved.url),
  );

  const failures = [];
  for (const source of sources) {
    const etag = saved && saved.url === source.url ? saved.etag : null;
    log(`${etag ? 'checking for updates' : 'downloading'} via ${source.name}: ${source.url}`);

    try {
      const result = await download(source, etag);

      if (result.notModified) {
        log(`openapi.json is up to date (ETag unchanged, via ${source.name}).`);
        return;
      }

      const { text, spec } = result;
      writeAtomic(dest, text);
      saveRecord(source.url, result.etag);
      log(
        `${etag ? 'updated' : 'saved'} openapi.json via ${source.name} ` +
          `(${(Buffer.byteLength(text) / 1024).toFixed(0)} KB, ` +
          `${Object.keys(spec.paths).length} paths, ${countOperations(spec)} operations)`,
      );
      return;
    } catch (err) {
      failures.push({ source, reason: describe(err) });
      const next = sources[sources.indexOf(source) + 1];
      console.warn(
        `[fetch-openapi] ${source.name} failed: ${describe(err)}` +
          (next ? `; failing over to ${next.name}` : ''),
      );
    }
  }

  const summary = failures.map((f) => `  - ${f.source.name}: ${f.reason}`).join('\n');
  if (fs.existsSync(dest)) {
    console.warn(
      `[fetch-openapi] warning: could not refresh the spec from any source; keeping the existing openapi.json.\n${summary}`,
    );
    return;
  }
  console.error(
    `[fetch-openapi] error: could not download the OpenAPI spec from any source.\n${summary}\n\n` +
      `  The build needs ${dest}.\n` +
      `  Fix your network/proxy and retry, or download the file manually to that path,\n` +
      `  or point OPENAPI_SPEC_URL at another location.`,
  );
  process.exit(1);
}

main();
