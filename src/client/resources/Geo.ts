import { ApiCore, RequestOptions } from '../ApiCore';

export class Geo {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  clientRegions(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/clientRegions', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  isps(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/isps', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  stagingServers(reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/stagingServers', reqOptions);
  }

  publicIpList(reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/publicIpList', reqOptions);
  }

  originFastRouteIpList(reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/originFastRouteIpList', reqOptions);
  }

  ipDetails(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/ngadmin/ipDetails', { ...reqOptions, body });
  }
}
