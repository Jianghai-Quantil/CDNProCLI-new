import { ApiCore, RequestOptions } from '../ApiCore';

export class Shields {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/shields', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('GET', `/cdn/shields/${encodeURIComponent(id)}`, reqOptions);
  }
}
