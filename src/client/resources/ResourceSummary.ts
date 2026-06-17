import { ApiCore, RequestOptions } from '../ApiCore';

export class ResourceSummary {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  getByCustomer(customerId: string | number, reqOptions: RequestOptions = {}) {
    if (customerId === undefined || customerId === null || customerId === '') {
      throw new Error('customerId is required');
    }
    return this.api.request('GET', '/cdn/resourceSummary', { ...reqOptions, query: { customerId: String(customerId) } });
  }
}
