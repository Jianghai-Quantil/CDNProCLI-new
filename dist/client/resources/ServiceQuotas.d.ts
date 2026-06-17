import { ApiCore, RequestOptions } from '../ApiCore';
export declare class ServiceQuotas {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    get(serviceQuotaId: string, reqOptions?: RequestOptions): Promise<unknown>;
    getByCustomer(customerId: string | number, reqOptions?: RequestOptions): Promise<unknown>;
    update(serviceQuotaId: string, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
    updateByCustomer(customerId: string | number, patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=ServiceQuotas.d.ts.map