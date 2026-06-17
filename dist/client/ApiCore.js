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
exports.ApiCore = void 0;
exports.encodeQuery = encodeQuery;
exports.withQuery = withQuery;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const zlib = __importStar(require("zlib"));
const crypto = __importStar(require("crypto"));
function isPlainObject(v) {
    return v != null && typeof v === 'object' && !Array.isArray(v);
}
function encodeQuery(query) {
    if (!query)
        return '';
    const parts = [];
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '')
            continue;
        if (Array.isArray(value)) {
            parts.push(`${encodeURIComponent(key)}=${value.map((x) => encodeURIComponent(String(x))).join(',')}`);
        }
        else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.length ? `?${parts.join('&')}` : '';
}
function withQuery(path, query) {
    if (!query || Object.keys(query).length === 0)
        return path;
    const qs = encodeQuery(query);
    if (!qs)
        return path;
    if (path.includes('?'))
        return `${path}&${qs.slice(1)}`;
    return `${path}${qs}`;
}
class ApiCore {
    serverInfo;
    defaults;
    _agents = null;
    constructor(serverInfo, defaults = {}) {
        if (!serverInfo)
            throw new Error('serverInfo is required');
        this.serverInfo = serverInfo;
        this.defaults = defaults || {};
        this._ensureAgents();
    }
    _ensureAgents() {
        if (this._agents)
            return;
        const base = {
            keepAlive: true,
            keepAliveMsecs: 30_000,
            maxSockets: 256,
            maxFreeSockets: 64,
            ...(this.serverInfo.family ? { family: this.serverInfo.family } : {}),
        };
        this._agents = {
            http: new http.Agent(base),
            https: new https.Agent(base),
        };
    }
    _resetAgents() {
        if (this._agents) {
            try {
                this._agents.http.destroy();
            }
            catch (_) { /* ignore */ }
            try {
                this._agents.https.destroy();
            }
            catch (_) { /* ignore */ }
        }
        this._agents = null;
        this._ensureAgents();
    }
    _buildAuth(options) {
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
        const out = {
            hostname: serverInfo.host,
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Basic ${authData}`,
                Date: dateStr,
                'Accept-Encoding': 'gzip',
                'User-Agent': 'CDNProCLI-js/2.0',
            },
            timeout: 10000,
            abortOnError: true,
            verbose: 0,
        };
        if (serverInfo.family)
            out.family = serverInfo.family;
        if (options) {
            if (options.noCache === true)
                out.headers['Cache-Control'] = 'no-cache';
            if (options.includeChildren === true)
                out.headers['Report-Range'] = 'self+children';
            if (options.reportRange)
                out.headers['Report-Range'] = options.reportRange;
            if (options.onBehalfOf != null)
                out.headers['On-Behalf-Of'] = String(options.onBehalfOf);
            if (options.debug != null)
                out.headers['x-debug'] = String(options.debug);
            if (options.abortOnError != null)
                out.abortOnError = options.abortOnError;
            if (options.verbose != null)
                out.verbose = options.verbose;
        }
        return out;
    }
    async _callServer(options) {
        const stime = Date.now();
        const body = options.reqBody;
        if (!options.headers)
            options.headers = {};
        if (body !== undefined && body !== null) {
            options.headers['Content-Length'] = `${Buffer.byteLength(body)}`;
        }
        const ctx = options.ctx || {};
        ctx.options = options;
        ctx.times = { start: stime };
        const schemeStr = options.scheme === 'http' ? 'http' : 'https';
        const scheme = schemeStr === 'http' ? http : https;
        this._ensureAgents();
        options.agent = schemeStr === 'http' ? this._agents.http : this._agents.https;
        if (options.verbose > 1) {
            const portPart = options.port ? `:${options.port}` : '';
            console.log(options.method, `${schemeStr}://${options.hostname}${portPart}${options.path}`);
            console.log(options.headers);
            if (body)
                console.log(body, '\n');
        }
        return await new Promise((resolve, reject) => {
            const request = scheme.request(options, (res) => {
                const hdrTime = Date.now();
                ctx._res = res;
                ctx.times.header = hdrTime;
                ctx.remoteAddress = res.socket?.remoteAddress;
                if (schemeStr === 'https') {
                    res.socket.peerCertificate =
                        res.socket.getPeerCertificate?.();
                }
                const statusOk = res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204;
                let uncomp = null;
                const ce = res.headers['content-encoding'];
                if (ce === 'br')
                    uncomp = zlib.createBrotliDecompress();
                else if (ce === 'gzip')
                    uncomp = zlib.createGunzip();
                let data = '';
                let len = 0;
                const finalProc = () => {
                    const resTime = Date.now();
                    ctx.times.finish = resTime;
                    ctx.bodyBytes = { raw: len, decoded: data.length };
                    if (options.verbose > 0) {
                        const headerSec = (hdrTime - stime) / 1000;
                        const totalSec = (resTime - stime) / 1000;
                        console.log(`hdrTime ${headerSec}s, total ${totalSec}s, got status ${res.statusCode} w/ ${len} => ${data.length} bytes from ${options.method} ${options.hostname}${options.path}`);
                        if (options.verbose > 1 && statusOk === false) {
                            console.log(data);
                        }
                    }
                    let obj = data;
                    const ct = res.headers['content-type'] || '';
                    if (ct.includes('application/json')) {
                        try {
                            obj = data.length ? JSON.parse(data) : null;
                        }
                        catch (_) {
                            obj = data;
                        }
                    }
                    if (statusOk || options.abortOnError !== true) {
                        resolve({ obj, ctx: ctx });
                        return;
                    }
                    const err = new Error(`Status code is ${res.statusCode}, not 200/201/204`);
                    err.body = obj;
                    err.ctx = ctx;
                    reject(err);
                };
                res.on('data', (chunk) => {
                    len += chunk.length;
                    if (uncomp)
                        uncomp.write(chunk);
                    else
                        data += chunk;
                });
                res.on('end', () => {
                    if (uncomp)
                        uncomp.end();
                    else
                        finalProc();
                });
                if (uncomp) {
                    uncomp.on('data', (chunk) => { data += chunk; });
                    uncomp.on('end', finalProc);
                }
            });
            request.on('error', (err) => {
                err.ctx = ctx;
                reject(err);
            });
            request.on('socket', (socket) => {
                ctx.times.socket = Date.now();
                const flag = '__cdnproTimingListenersAttached';
                const s = socket;
                if (socket && s[flag] !== true) {
                    s[flag] = true;
                    socket.once('lookup', () => { ctx.times.dns = Date.now(); });
                    socket.once('connect', () => { ctx.times.connect = Date.now(); });
                    if (schemeStr === 'https') {
                        socket.once('secureConnect', () => { ctx.times.tls = Date.now(); });
                    }
                }
            });
            request.setTimeout(30000, () => {
                const err = new Error('Request timed out after 30 seconds.');
                err.ctx = ctx;
                reject(err);
            });
            if (body !== undefined && body !== null)
                request.write(body);
            request.end();
        });
    }
    async request(method, path, req = {}) {
        const merged = { ...this.defaults, ...(req || {}) };
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
                options.reqBody = merged.body;
            }
            else if (isPlainObject(merged.body) || Array.isArray(merged.body)) {
                options.reqBody = JSON.stringify(merged.body);
            }
            else {
                options.reqBody = String(merged.body);
            }
        }
        const rsp = await this._callServer(options);
        return merged.raw ? rsp : rsp.obj;
    }
}
exports.ApiCore = ApiCore;
//# sourceMappingURL=ApiCore.js.map