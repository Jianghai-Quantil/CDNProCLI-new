import { ServerInfo, RequestOptions } from './ApiCore';
import { Properties } from './resources/Properties';
import { Certificates } from './resources/Certificates';
import { DeploymentTasks } from './resources/DeploymentTasks';
import { EdgeHostnames } from './resources/EdgeHostnames';
import { Purges } from './resources/Purges';
import { Prefetches } from './resources/Prefetches';
import { Secrets } from './resources/Secrets';
import { Webhooks } from './resources/Webhooks';
import { Validations } from './resources/Validations';
import { ServiceQuotas } from './resources/ServiceQuotas';
import { Report } from './resources/Report';
import { LogConfigs } from './resources/LogConfigs';
import { LogAggregationPoints } from './resources/LogAggregationPoints';
import { Annotations } from './resources/Annotations';
import { SystemConfigs } from './resources/SystemConfigs';
import { Customers } from './resources/Customers';
import { Geo } from './resources/Geo';
import { ResourceSummary } from './resources/ResourceSummary';
import { Hostnames } from './resources/Hostnames';
import { HostnameHistory } from './resources/HostnameHistory';
import { ApiPermissions } from './resources/ApiPermissions';
import { Shields } from './resources/Shields';
import { Contacts } from './resources/Contacts';
import { ApiAccounts } from './resources/ApiAccounts';
import { ApiCalls } from './resources/ApiCalls';
export { ServerInfo, RequestOptions };
/**
 * CDN Pro API client.
 *
 * @example
 * const client = new CDNProClient({ host: 'ngapi.cdnetworks.com', user: '...', secretKey: '...' });
 * const props = await client.properties.list({ limit: 10 });
 */
export declare class CDNProClient {
    serverInfo: ServerInfo;
    private _api;
    properties: Properties;
    certificates: Certificates;
    edgeHostnames: EdgeHostnames;
    secrets: Secrets;
    deployments: DeploymentTasks;
    /** Alias for deployments */
    deploymentTasks: DeploymentTasks;
    serviceQuotas: ServiceQuotas;
    report: Report;
    logConfigs: LogConfigs;
    logAggregationPoints: LogAggregationPoints;
    annotations: Annotations;
    systemConfigs: SystemConfigs;
    customers: Customers;
    validations: Validations;
    webhooks: Webhooks;
    purges: Purges;
    prefetches: Prefetches;
    geo: Geo;
    resourceSummary: ResourceSummary;
    hostnames: Hostnames;
    hostnameHistory: HostnameHistory;
    apiPermissions: ApiPermissions;
    shields: Shields;
    contacts: Contacts;
    apiAccounts: ApiAccounts;
    apiCalls: ApiCalls;
    constructor(serverInfo: ServerInfo);
    /** Low-level escape hatch to call any endpoint directly. */
    request(method: string, path: string, reqOptions?: RequestOptions): Promise<unknown>;
}
//# sourceMappingURL=CDNProClient.d.ts.map