import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Secrets {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(secretID: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(secretID: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(secretID: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Secrets.d.ts.map