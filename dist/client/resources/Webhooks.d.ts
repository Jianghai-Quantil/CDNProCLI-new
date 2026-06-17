import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Webhooks {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(id: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(id: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Webhooks.d.ts.map