import { ApiCore, RequestOptions } from '../ApiCore';

export class Properties {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/properties', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(propertyID: string, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    return this.api.request('GET', `/cdn/properties/${encodeURIComponent(propertyID)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/properties', { ...reqOptions, body });
  }

  update(propertyID: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/properties/${encodeURIComponent(propertyID)}`, { ...reqOptions, body: patchBody });
  }

  delete(propertyID: string, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    return this.api.request('DELETE', `/cdn/properties/${encodeURIComponent(propertyID)}`, reqOptions);
  }

  listVersions(propertyID: string, query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    return this.api.request('GET', `/cdn/properties/${encodeURIComponent(propertyID)}/versions`, { ...reqOptions, query: query as RequestOptions['query'] });
  }

  createVersion(propertyID: string, body: unknown, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    if (!body) throw new Error('body is required');
    return this.api.request('POST', `/cdn/properties/${encodeURIComponent(propertyID)}/versions`, { ...reqOptions, body });
  }

  getVersion(propertyID: string, version: string | number, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    if (version === undefined || version === null || version === '') throw new Error('version is required');
    return this.api.request(
      'GET',
      `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`,
      reqOptions,
    );
  }

  patchVersion(propertyID: string, version: string | number, body: unknown, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    if (version === undefined || version === null || version === '') throw new Error('version is required');
    if (!body) throw new Error('body is required');
    return this.api.request(
      'PATCH',
      `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`,
      { ...reqOptions, body },
    );
  }

  deleteVersion(propertyID: string, version: string | number, reqOptions: RequestOptions = {}) {
    if (!propertyID) throw new Error('propertyID is required');
    if (version === undefined || version === null || version === '') throw new Error('version is required');
    return this.api.request(
      'DELETE',
      `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`,
      reqOptions,
    );
  }
}
