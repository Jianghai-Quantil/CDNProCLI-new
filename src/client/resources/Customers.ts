import { ApiCore, RequestOptions } from '../ApiCore';

export class Customers {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/ngadmin/customers', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('GET', `/ngadmin/customers/${encodeURIComponent(String(id))}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/ngadmin/customers', { ...reqOptions, body });
  }

  update(id: string | number, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/ngadmin/customers/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
  }
}
