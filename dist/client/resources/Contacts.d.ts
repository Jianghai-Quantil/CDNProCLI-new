import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Contacts {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string | number, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(id: string | number, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(id: string | number, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Contacts.d.ts.map