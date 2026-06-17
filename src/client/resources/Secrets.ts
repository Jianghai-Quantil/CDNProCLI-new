import { ApiCore, RequestOptions } from '../ApiCore';

export class Secrets {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/secrets', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(secretID: string, reqOptions: RequestOptions = {}) {
    if (!secretID) throw new Error('secretID is required');
    return this.api.request('GET', `/cdn/secrets/${encodeURIComponent(secretID)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/secrets', { ...reqOptions, body });
  }

  update(secretID: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!secretID) throw new Error('secretID is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/secrets/${encodeURIComponent(secretID)}`, { ...reqOptions, body: patchBody });
  }

  delete(secretID: string, reqOptions: RequestOptions = {}) {
    if (!secretID) throw new Error('secretID is required');
    return this.api.request('DELETE', `/cdn/secrets/${encodeURIComponent(secretID)}`, reqOptions);
  }
}
