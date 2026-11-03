import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';
import * as crypto from 'crypto';

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
  includeChildren?: boolean;
  abortOnError?: boolean;
  verbose?: number;
  debug?: unknown;
  raw?: boolean;
  newConnection?: boolean;
  /** Override the Date string used for auth + body encryption (e.g. cert upload). */
  dateOverride?: string;
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
  _res: http.IncomingMessage;
}

export interface RawResponse<T = unknown> {
  obj: T;
  ctx: ResponseContext;
}

interface ApiError extends Error {
  body?: unknown;
  ctx?: ResponseContext;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function encodeQuery(query: Record<string, string | number | boolean | string[]>): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      parts.push(`${encodeURIComponent(key)}=${value.map((x) => encodeURIComponent(String(x))).join(',')}`);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

function withQuery(path: string, query?: Record<string, string | number | boolean | string[]>): string {
  if (!query || Object.keys(query).length === 0) return path;
  const qs = encodeQuery(query);
  if (!qs) return path;
  if (path.includes('?')) return `${path}&${qs.slice(1)}`;
  return `${path}${qs}`;
}

interface AgentPool {
  http: http.Agent;
  https: https.Agent;
}

interface BuildAuthResult {
  hostname: string;
  method: string;
  headers: Record<string, string>;
  timeout: number;
  abortOnError: boolean;
  verbose: number;
  family?: number;
  path?: string;
  scheme?: string;
  port?: number;
  agent?: http.Agent | https.Agent;
  reqBody?: string | Buffer;
  ctx?: Partial<ResponseContext>;
}

export class ApiCore {
  serverInfo: ServerInfo;
  defaults: RequestOptions;
  private _agents: AgentPool | null = null;

  constructor(serverInfo: ServerInfo, defaults: RequestOptions = {}) {
    if (!serverInfo) throw new Error('serverInfo is required');
    this.serverInfo = serverInfo;
    this.defaults = defaults || {};
    this._ensureAgents();
  }

  private _ensureAgents(): void {
    if (this._agents) return;
    const base = {
      keepAlive: true,
      keepAliveMsecs: 30_000,
      maxSockets: 256,
      maxFreeSockets: 64,
      ...(this.serverInfo.family ? { family: this.serverInfo.family } : {}),
    };

    const httpAgent = new http.Agent(base);
    const httpsAgent = new https.Agent(base);

    // Proactively remove sockets from the free pool when the server
    // closes an idle keep-alive connection (avoids "socket hang up").
    const cleanupFreeSockets = (agent: http.Agent) => {
      agent.on('free', (socket) => {
        socket.once('close', () => {
          // Server closed idle socket → destroy it so the
          // agent removes it from the free pool.
          socket.destroy();
        });
      });
    };
    cleanupFreeSockets(httpAgent);
    cleanupFreeSockets(httpsAgent);

    this._agents = { http: httpAgent, https: httpsAgent };
  }

  private _resetAgents(): void {
    if (this._agents) {
      try { this._agents.http.destroy(); } catch (_) { /* ignore */ }
      try { this._agents.https.destroy(); } catch (_) { /* ignore */ }
    }
    this._agents = null;
    this._ensureAgents();
  }

  private _buildAuth(options: RequestOptions): BuildAuthResult {
    const serverInfo = this.serverInfo;
    if (!serverInfo?.host || !serverInfo.user || !serverInfo.secretKey) {
      throw new Error('serverInfo must include {host, user, secretKey}');
    }

    const now = new Date();
    const dateStr = options.dateOverride ?? now.toUTCString();
    const hmac = crypto.createHmac('sha1', serverInfo.secretKey);
    hmac.update(dateStr);
    const b64passwd = hmac.digest('base64');
    const authData = Buffer.from(`${serverInfo.user}:${b64passwd}`).toString('base64');

    const out: BuildAuthResult = {
      hostname: serverInfo.host,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${authData}`,
        Date: dateStr,
        'Accept-Encoding': 'gzip',
        'User-Agent': 'CDNPro-CLI-js/2.0',
      },
      timeout: 10000,
      abortOnError: true,
      verbose: 0,
    };

    if (serverInfo.family) out.family = serverInfo.family;

    if (options) {
      if (options.noCache === true) out.headers['Cache-Control'] = 'no-cache';
      if (options.includeChildren === true) out.headers['Report-Range'] = 'self+children';
      if (options.reportRange) out.headers['Report-Range'] = options.reportRange;
      if (options.onBehalfOf != null) out.headers['On-Behalf-Of'] = String(options.onBehalfOf);
      if (options.debug != null) out.headers['x-debug'] = String(options.debug);
      if (options.abortOnError != null) out.abortOnError = options.abortOnError;
      if (options.verbose != null) out.verbose = options.verbose;
    }

    return out;
  }

  private async _callServer(options: BuildAuthResult): Promise<RawResponse> {
    const stime = Date.now();
    const body = options.reqBody;
    if (!options.headers) options.headers = {};
    if (body !== undefined && body !== null) {
      options.headers['Content-Length'] = `${Buffer.byteLength(body)}`;
    }

    const ctx: Partial<ResponseContext> = options.ctx || {};
    ctx.options = options as unknown as Record<string, unknown>;
    ctx.times = { start: stime };

    const schemeStr = options.scheme === 'http' ? 'http' : 'https';
    const scheme = schemeStr === 'http' ? http : https;

    this._ensureAgents();
    options.agent = schemeStr === 'http' ? this._agents!.http : this._agents!.https;

    if (options.verbose > 1) {
      const portPart = options.port ? `:${options.port}` : '';
      console.log(options.method, `${schemeStr}://${options.hostname}${portPart}${options.path}`);
      console.log(options.headers);
      if (body) console.log(body, '\n');
    }

    const doRequest = (): Promise<RawResponse> => new Promise((resolve, reject) => {
      const request = scheme.request(options as https.RequestOptions, (res) => {
        const hdrTime = Date.now();
        ctx._res = res;
        ctx.times!.header = hdrTime;
        ctx.remoteAddress = res.socket?.remoteAddress;
        if (schemeStr === 'https') {
          (res.socket as unknown as Record<string, unknown>).peerCertificate =
            (res.socket as unknown as tls.TLSSocket).getPeerCertificate?.();
        }

        const statusOk = res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204;

        let uncomp: zlib.Gunzip | zlib.BrotliDecompress | null = null;
        const ce = res.headers['content-encoding'];
        if (ce === 'br') uncomp = zlib.createBrotliDecompress();
        else if (ce === 'gzip') uncomp = zlib.createGunzip();

        let data = '';
        let len = 0;

        const finalProc = () => {
          const resTime = Date.now();
          ctx.times!.finish = resTime;
          ctx.bodyBytes = { raw: len, decoded: data.length };

          if (options.verbose > 0) {
            const headerSec = (hdrTime - stime) / 1000;
            const totalSec = (resTime - stime) / 1000;
            console.log(
              `hdrTime ${headerSec}s, total ${totalSec}s, got status ${res.statusCode} w/ ${len} => ${data.length} bytes from ${options.method} ${options.hostname}${options.path}`,
            );
            if (options.verbose > 1 && statusOk === false) {
              console.log(data);
            }
          }

          let obj: unknown = data;
          const ct = res.headers['content-type'] || '';
          if (ct.includes('application/json')) {
            try {
              obj = data.length ? JSON.parse(data) : null;
            } catch (_) {
              obj = data;
            }
          }

          if (statusOk || options.abortOnError !== true) {
            resolve({ obj, ctx: ctx as ResponseContext });
            return;
          }

          const err: ApiError = new Error(`Status code is ${res.statusCode}, not 200/201/204`);
          err.body = obj;
          err.ctx = ctx as ResponseContext;
          reject(err);
        };

        res.on('data', (chunk: Buffer) => {
          len += chunk.length;
          if (uncomp) uncomp.write(chunk);
          else data += chunk;
        });

        res.on('end', () => {
          if (uncomp) uncomp.end();
          else finalProc();
        });

        if (uncomp) {
          uncomp.on('data', (chunk: Buffer) => { data += chunk; });
          uncomp.on('end', finalProc);
        }
      });

      request.on('error', (err: ApiError) => {
        err.ctx = ctx as ResponseContext;
        reject(err);
      });

      request.on('socket', (socket) => {
        ctx.times!.socket = Date.now();

        const flag = '__cdnproTimingListenersAttached';
        const s = socket as unknown as Record<string, unknown>;
        if (socket && s[flag] !== true) {
          s[flag] = true;
          socket.once('lookup', () => { ctx.times!.dns = Date.now(); });
          socket.once('connect', () => { ctx.times!.connect = Date.now(); });
          if (schemeStr === 'https') {
            socket.once('secureConnect', () => { ctx.times!.tls = Date.now(); });
          }
        }
      });

      request.setTimeout(30000, () => {
        const err: ApiError = new Error('Request timed out after 30 seconds.');
        err.ctx = ctx as ResponseContext;
        reject(err);
      });

      if (body !== undefined && body !== null) request.write(body);
      request.end();
    });

    try {
      return await doRequest();
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ECONNRESET' || code === 'EPIPE') {
        if (options.verbose > 0) {
          console.log(`Socket error (${code}), retrying with fresh connection…`);
        }
        this._resetAgents();
        options.agent = (options.scheme === 'http' ? this._agents!.http : this._agents!.https);
        return await doRequest();
      }
      throw err;
    }
  }

  async request(method: string, path: string, req: RequestOptions = {}): Promise<unknown> {
    const merged: RequestOptions & { newConnection?: boolean } = { ...this.defaults, ...(req || {}) };

    if (merged.newConnection === true) {
      this._resetAgents();
    }

    const options = this._buildAuth({
      noCache: merged.noCache,
      includeChildren: merged.includeChildren,
      reportRange: merged.reportRange,
      onBehalfOf: merged.onBehalfOf,
      abortOnError: merged.abortOnError,
      verbose: merged.verbose,
      debug: merged.debug,
      dateOverride: merged.dateOverride,
    });

    options.method = method;
    options.path = withQuery(path, merged.query);

    if (merged.headers) {
      options.headers = { ...options.headers, ...merged.headers };
    }

    if (merged.body !== undefined && merged.body !== null) {
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json; charset=UTF-8';
      }
      if (Buffer.isBuffer(merged.body) || typeof merged.body === 'string') {
        options.reqBody = merged.body as string | Buffer;
      } else if (isPlainObject(merged.body) || Array.isArray(merged.body)) {
        options.reqBody = JSON.stringify(merged.body);
      } else {
        options.reqBody = String(merged.body);
      }
    }

    const rsp = await this._callServer(options);
    return merged.raw ? rsp : rsp.obj;
  }
}

// Needed for the TLSSocket cast above
import type * as tls from 'tls';

export { encodeQuery, withQuery };
