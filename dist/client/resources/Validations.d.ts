import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Validations {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Validations.d.ts.map