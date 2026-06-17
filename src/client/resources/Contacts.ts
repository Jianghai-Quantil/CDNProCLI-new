import { ApiCore, RequestOptions } from '../ApiCore';

export class Contacts {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/ngadmin/contacts', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('GET', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/ngadmin/contacts', { ...reqOptions, body });
  }

  update(id: string | number, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
  }

  delete(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('DELETE', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, reqOptions);
  }
}
