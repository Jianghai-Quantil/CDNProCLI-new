import { ApiCore, RequestOptions } from '../ApiCore';

export class Hostnames {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/hostnames', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(hostname: string, reqOptions: RequestOptions = {}) {
    if (!hostname) throw new Error('hostname is required');
    return this.api.request('GET', `/cdn/hostnames/${encodeURIComponent(hostname)}`, reqOptions);
  }
}
