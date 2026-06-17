import { ApiCore, RequestOptions } from '../ApiCore';

export class Webhooks {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/webhooks', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('GET', `/cdn/webhooks/${encodeURIComponent(id)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/webhooks', { ...reqOptions, body });
  }

  update(id: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/webhooks/${encodeURIComponent(id)}`, { ...reqOptions, body: patchBody });
  }

  delete(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('DELETE', `/cdn/webhooks/${encodeURIComponent(id)}`, reqOptions);
  }
}
