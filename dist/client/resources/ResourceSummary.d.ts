import { ApiCore, RequestOptions } from '../ApiCore';
export declare class ResourceSummary {
    private api;
    constructor(apiCore: ApiCore);
    getByCustomer(customerId: string | number, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=ResourceSummary.d.ts.map