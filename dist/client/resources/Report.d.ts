import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Report {
    private api;
    constructor(apiCore: ApiCore);
    post(endpointPath: string, { query, body }?: {
        query?: Record<string, unknown>;
        body?: unknown;
    }, reqOptions?: RequestOptions): Promise<unknown>;
    bandwidth(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    vol(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    volSummary(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    req(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    reqSummary(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    cpuTime(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    logDownload(query?: Record<string, unknown>, body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Report.d.ts.map