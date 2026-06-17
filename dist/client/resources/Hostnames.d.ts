import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Hostnames {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(hostname: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Hostnames.d.ts.map