import * as http from 'http';
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
    bodyBytes: {
        raw: number;
        decoded: number;
    };
    remoteAddress?: string;
    _res: http.IncomingMessage;
}
export interface RawResponse<T = unknown> {
    obj: T;
    ctx: ResponseContext;
}
declare function encodeQuery(query: Record<string, string | number | boolean | string[]>): string;
declare function withQuery(path: string, query?: Record<string, string | number | boolean | string[]>): string;
export declare class ApiCore {
    serverInfo: ServerInfo;
    defaults: RequestOptions;
    private _agents;
    constructor(serverInfo: ServerInfo, defaults?: RequestOptions);
    private _ensureAgents;
    private _resetAgents;
    private _buildAuth;
    private _callServer;
    request(method: string, path: string, req?: RequestOptions): Promise<unknown>;
}
export { encodeQuery, withQuery };
//# sourceMappingURL=ApiCore.d.ts.map