import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Annotations {
    private api;
    constructor(apiCore: ApiCore);
    list(body?: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string | number, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(id: string | number, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(id: string | number, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Annotations.d.ts.map