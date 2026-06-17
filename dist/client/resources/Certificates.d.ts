import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Certificates {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(certificateID: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(certificateID: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(certificateID: string, reqOptions?: RequestOptions): Promise<unknown>;
    downloadCSR(certificateID: string, query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    getVersion(certificateID: string, version: string | number, reqOptions?: RequestOptions): Promise<unknown>;
    deleteVersion(certificateID: string, version: string | number, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Certificates.d.ts.map