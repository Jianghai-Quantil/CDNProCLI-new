import { ApiCore, RequestOptions } from '../ApiCore';
export declare class DeploymentTasks {
    private api;
    constructor(apiCore: ApiCore);
    list(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    get(id: string, reqOptions?: RequestOptions): Promise<unknown>;
    create(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=DeploymentTasks.d.ts.map