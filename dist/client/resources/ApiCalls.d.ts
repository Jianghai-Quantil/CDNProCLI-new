import { ApiCore, RequestOptions } from '../ApiCore';
export declare class ApiCalls {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=ApiCalls.d.ts.map