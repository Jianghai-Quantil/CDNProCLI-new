import { ApiCore, RequestOptions } from '../ApiCore';
export declare class SystemConfigs {
    private api;
    constructor(apiCore: ApiCore);
    get(reqOptions?: RequestOptions): Promise<unknown>;
    update(patchBody: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=SystemConfigs.d.ts.map