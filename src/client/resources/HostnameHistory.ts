import { ApiCore, RequestOptions } from '../ApiCore';

export class HostnameHistory {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/hostnames/historical', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(hostname: string, query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    if (!hostname) throw new Error('hostname is required');
    return this.api.request('GET', `/cdn/hostnames/historical/${encodeURIComponent(hostname)}`, { ...reqOptions, query: query as RequestOptions['query'] });
  }
}
