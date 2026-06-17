import { ApiCore, RequestOptions } from '../ApiCore';
export declare class EdgeHostnames {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(edgeHostname: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    replace(edgeHostname: string, body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    update(edgeHostname: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    delete(edgeHostname: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=EdgeHostnames.d.ts.map