import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Properties {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(propertyID: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(propertyID: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(propertyID: string, reqOptions?: RequestOptions): Promise<unknown>;
    listVersions(propertyID: string, query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    createVersion(propertyID: string, body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    getVersion(propertyID: string, version: string | number, reqOptions?: RequestOptions): Promise<unknown>;
    patchVersion(propertyID: string, version: string | number, body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    deleteVersion(propertyID: string, version: string | number, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Properties.d.ts.map