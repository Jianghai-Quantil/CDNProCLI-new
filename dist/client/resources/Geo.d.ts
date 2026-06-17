import { ApiCore, RequestOptions } from '../ApiCore';
export declare class Geo {
    private api;
    constructor(apiCore: ApiCore);
    clientRegions(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    isps(query?: Record<string, unknown>, reqOptions?: RequestOptions): Promise<unknown>;
    stagingServers(reqOptions?: RequestOptions): Promise<unknown>;
    publicIpList(reqOptions?: RequestOptions): Promise<unknown>;
    originFastRouteIpList(reqOptions?: RequestOptions): Promise<unknown>;
    ipDetails(body: unknown, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=Geo.d.ts.map