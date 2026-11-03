#!/usr/bin/env node
'use strict';

/**
 * Downloads the CDN Pro OpenAPI spec to <repo>/openapi.json.
 *
 * The spec is not committed to this repo. It is fetched at build time from the
 * docs-content-cdn repo (the single source of truth) and git-ignored.
 *
 * The server's ETag is saved next to the spec (openapi.json.etag, git-ignored) and
 * sent back as If-None-Match on later runs, so the file is only re-downloaded when
 * it has actually changed upstream (HTTP 304 = still up to date).
 *
 * Usage:
 *   node scripts/fetch-openapi.js            download if missing, or if upstream changed (ETag)
 *   node scripts/fetch-openapi.js --force    always re-download, ignoring the saved ETag
 *
 * Environment:
 *   OPENAPI_SPEC_URL   override the source. Both raw.githubusercontent.com URLs and
 *                      github.com/<owner>/<repo>/blob/<ref>/<path> URLs are accepted
 *                      (the latter is rewritten to the raw form).
 *
 * Failure behaviour:
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

const dest = path.join(__dirname, '..', 'openapi.json');
const etagFile = `${dest}.etag`;
const force = process.argv.includes('--force');
const log = (msg) => console.log(`[fetch-openapi] ${msg}`);

/** Turn a github.com "blob" page URL into the raw-content URL; leave anything else alone. */
function toRawUrl(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : url;
}

function describe(err) {
  const cause = err && err.cause && (err.cause.code || err.cause.message);
  return cause ? `${err.message} (${cause})` : String(err && err.message ? err.message : err);
}

/** Write via a temp file so an interrupted run never leaves a half-written file behind. */
function writeAtomic(file, contents) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
}

/**
 * The saved ETag, or null if there is none / it belongs to a different URL / the spec
 * file itself is missing (an ETag is meaningless without the file it describes).
 */
function readSavedEtag(url) {
  if (!fs.existsSync(dest) || !fs.existsSync(etagFile)) return null;
  try {
    const saved = JSON.parse(fs.readFileSync(etagFile, 'utf8'));
    return saved && saved.url === url && typeof saved.etag === 'string' && saved.etag ? saved.etag : null;
  } catch {
    return null; // corrupt sidecar: just do a full download
  }
}

function saveEtag(url, etag) {
  if (etag) {
    writeAtomic(etagFile, JSON.stringify({ url, etag }) + '\n');
  } else {
    fs.rmSync(etagFile, { force: true }); // server sent no ETag: don't keep a stale one
  }
}

/**
 * Fetches the spec. Resolves to { notModified: true } on HTTP 304, otherwise
 * { text, spec, etag } for a validated OpenAPI document.
 */
async function download(url, etag) {
  if (typeof fetch !== 'function') {
    throw new Error(`global fetch() is not available in Node ${process.version}; Node 18+ is required`);
  }
  const headers = { Accept: 'application/json' };
  if (etag) headers['If-None-Match'] = etag;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(fs.existsSync(dest) ? CHECK_TIMEOUT_MS : DOWNLOAD_TIMEOUT_MS),
  });
  if (res.status === 304) return { notModified: true };
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const text = await res.text();
  const spec = JSON.parse(text); // throws on HTML error pages, truncated bodies, etc.
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
  const url = toRawUrl(process.env.OPENAPI_SPEC_URL || DEFAULT_URL);
  const etag = force ? null : readSavedEtag(url);
  log(etag ? `checking for updates: ${url}` : `downloading ${url}`);

  try {
    const result = await download(url, etag);

    if (result.notModified) {
      log('openapi.json is up to date (ETag unchanged).');
      return;
    }

    const { text, spec } = result;
    writeAtomic(dest, text);
    saveEtag(url, result.etag);
    log(
      `${etag ? 'updated' : 'saved'} openapi.json (${(Buffer.byteLength(text) / 1024).toFixed(0)} KB, ` +
        `${Object.keys(spec.paths).length} paths, ${countOperations(spec)} operations)`,
    );
  } catch (err) {
    if (fs.existsSync(dest)) {
      console.warn(`[fetch-openapi] warning: could not refresh the spec (${describe(err)}); keeping the existing openapi.json.`);
      return;
    }
    console.error(
      `[fetch-openapi] error: could not download the OpenAPI spec.\n` +
        `  url:    ${url}\n` +
        `  reason: ${describe(err)}\n\n` +
        `  The build needs ${dest}.\n` +
        `  Fix your network/proxy and retry, or download the file manually to that path,\n` +
        `  or point OPENAPI_SPEC_URL at another location.`,
    );
    process.exit(1);
  }
}

main();
