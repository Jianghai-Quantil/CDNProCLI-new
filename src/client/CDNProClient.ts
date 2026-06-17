import { ApiCore, ServerInfo, RequestOptions } from './ApiCore';
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
export class CDNProClient {
  serverInfo: ServerInfo;
  private _api: ApiCore;

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

  constructor(serverInfo: ServerInfo) {
    this.serverInfo = serverInfo;
    this._api = new ApiCore(serverInfo);

    this.properties = new Properties(this._api);
    this.certificates = new Certificates(this._api);
    this.edgeHostnames = new EdgeHostnames(this._api);
    this.secrets = new Secrets(this._api);
    this.deployments = new DeploymentTasks(this._api);
    this.deploymentTasks = this.deployments;
    this.serviceQuotas = new ServiceQuotas(this._api);
    this.report = new Report(this._api);
    this.logConfigs = new LogConfigs(this._api);
    this.logAggregationPoints = new LogAggregationPoints(this._api);
    this.annotations = new Annotations(this._api);
    this.systemConfigs = new SystemConfigs(this._api);
    this.customers = new Customers(this._api);
    this.validations = new Validations(this._api);
    this.webhooks = new Webhooks(this._api);
    this.purges = new Purges(this._api);
    this.prefetches = new Prefetches(this._api);
    this.geo = new Geo(this._api);
    this.resourceSummary = new ResourceSummary(this._api);
    this.hostnames = new Hostnames(this._api);
    this.hostnameHistory = new HostnameHistory(this._api);
    this.apiPermissions = new ApiPermissions(this._api);
    this.shields = new Shields(this._api);
    this.contacts = new Contacts(this._api);
    this.apiAccounts = new ApiAccounts(this._api);
    this.apiCalls = new ApiCalls(this._api);
  }

  /** Low-level escape hatch to call any endpoint directly. */
  request(method: string, path: string, reqOptions: RequestOptions = {}) {
    return this._api.request(method, path, reqOptions);
  }
}
