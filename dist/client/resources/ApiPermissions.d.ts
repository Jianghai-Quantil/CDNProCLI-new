import { ApiCore, RequestOptions } from '../ApiCore';
export declare class ApiPermissions {
    private api;
    constructor(apiCore: ApiCore);
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(id: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(id: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=ApiPermissions.d.ts.map