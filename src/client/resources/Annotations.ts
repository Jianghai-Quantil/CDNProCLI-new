import { ApiCore, RequestOptions } from '../ApiCore';

export class Annotations {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  // annotation list uses POST to /cdn/annotationsList with optional filter body
  list(body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('POST', '/cdn/annotationsList', { ...reqOptions, body });
  }

  get(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('GET', `/cdn/annotations/${encodeURIComponent(String(id))}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/annotations', { ...reqOptions, body });
  }

  update(id: string | number, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/annotations/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
  }

  delete(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('DELETE', `/cdn/annotations/${encodeURIComponent(String(id))}`, reqOptions);
  }
}
