import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Prefetches {
    private api;
    constructor(apiCore: ApiCore);
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
    tokens(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Prefetches.d.ts.map