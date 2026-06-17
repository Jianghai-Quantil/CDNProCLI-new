import { ApiCore, RequestOptions } from '../ApiCore';

export class Prefetches {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/prefetches', { ...reqOptions, body });
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/prefetches', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('GET', `/cdn/prefetches/${encodeURIComponent(id)}`, reqOptions);
  }

  tokens(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/prefetches/prefetchTokens', { ...reqOptions, query: query as RequestOptions['query'] });
  }
}
