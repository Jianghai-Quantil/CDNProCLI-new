import { ApiCore, RequestOptions } from '../ApiCore';
export declare class HostnameHistory {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(hostname: string, query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=HostnameHistory.d.ts.map