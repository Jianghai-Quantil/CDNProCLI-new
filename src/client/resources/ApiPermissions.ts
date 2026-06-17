import { ApiCore, RequestOptions } from '../ApiCore';

export class ApiPermissions {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  get(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('GET', `/cdn/apiPermissions/${encodeURIComponent(id)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/apiPermissions', { ...reqOptions, body });
  }

  update(id: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/apiPermissions/${encodeURIComponent(id)}`, { ...reqOptions, body: patchBody });
  }

  delete(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('DELETE', `/cdn/apiPermissions/${encodeURIComponent(id)}`, reqOptions);
  }
}
