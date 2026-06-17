"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATION_MAP = void 0;
exports.lookupOperation = lookupOperation;
/**
 * Maps CLI resource.operation keys to OpenAPI path + method.
 * Used by `cdnpro schema <resource> <operation>` (Phase 5.3).
 */
exports.OPERATION_MAP = {
    // Properties
    'property.list': { method: 'get', path: '/cdn/properties' },
    'property.get': { method: 'get', path: '/cdn/properties/{propertyID}' },
    'property.create': { method: 'post', path: '/cdn/properties' },
    'property.update': { method: 'patch', path: '/cdn/properties/{propertyID}' },
    'property.delete': { method: 'delete', path: '/cdn/properties/{propertyID}' },
    // Property versions
    'property-version.list': { method: 'get', path: '/cdn/properties/{propertyID}/versions' },
    'property-version.get': { method: 'get', path: '/cdn/properties/{propertyID}/versions/{version}' },
    'property-version.create': { method: 'post', path: '/cdn/properties/{propertyID}/versions' },
    'property-version.update': { method: 'patch', path: '/cdn/properties/{propertyID}/versions/{version}' },
    'property-version.delete': { method: 'delete', path: '/cdn/properties/{propertyID}/versions/{version}' },
    // Certificates
    'cert.list': { method: 'get', path: '/cdn/certificates' },
    'cert.get': { method: 'get', path: '/cdn/certificates/{certificateID}' },
    'cert.create': { method: 'post', path: '/cdn/certificates' },
    'cert.update': { method: 'patch', path: '/cdn/certificates/{certificateID}' },
    'cert.delete': { method: 'delete', path: '/cdn/certificates/{certificateID}' },
    'cert.download-csr': { method: 'get', path: '/cdn/certificates/{certificateID}/csr' },
    'cert-version.get': { method: 'get', path: '/cdn/certificates/{certificateID}/versions/{version}' },
    'cert-version.delete': { method: 'delete', path: '/cdn/certificates/{certificateID}/versions/{version}' },
    // Edge hostnames
    'edge-hostname.list': { method: 'get', path: '/cdn/edgeHostnames' },
    'edge-hostname.get': { method: 'get', path: '/cdn/edgeHostnames/{edgeHostname}' },
    'edge-hostname.create': { method: 'post', path: '/cdn/edgeHostnames' },
    'edge-hostname.update': { method: 'patch', path: '/cdn/edgeHostnames/{edgeHostname}' },
    'edge-hostname.replace': { method: 'put', path: '/cdn/edgeHostnames/{edgeHostname}' },
    'edge-hostname.delete': { method: 'delete', path: '/cdn/edgeHostnames/{edgeHostname}' },
    // Deployment & validation
    'deploy.list': { method: 'get', path: '/cdn/deploymentTasks' },
    'deploy.get': { method: 'get', path: '/cdn/deploymentTasks/{id}' },
    'deploy.create': { method: 'post', path: '/cdn/deploymentTasks' },
    'validation.list': { method: 'get', path: '/cdn/validations' },
    'validation.get': { method: 'get', path: '/cdn/validations/{id}' },
    'validation.create': { method: 'post', path: '/cdn/validations' },
    // Hostnames
    'hostname.list': { method: 'get', path: '/cdn/hostnames' },
    'hostname.get': { method: 'get', path: '/cdn/hostnames/{hostname}' },
    // Hostname history
    'hostname-history.list': { method: 'get', path: '/cdn/hostnames/historical' },
    'hostname-history.get': { method: 'get', path: '/cdn/hostnames/historical/{hostname}' },
    // Purges
    'purge.create': { method: 'post', path: '/cdn/purges' },
    'purge.list': { method: 'get', path: '/cdn/purges' },
    'purge.get': { method: 'get', path: '/cdn/purges/{id}' },
    'purge.summary': { method: 'get', path: '/cdn/purges/purgeSummary' },
    'purge.tokens': { method: 'get', path: '/cdn/purges/purgeTokens' },
    // Prefetches
    'prefetch.list': { method: 'get', path: '/cdn/prefetches' },
    'prefetch.get': { method: 'get', path: '/cdn/prefetches/{id}' },
    'prefetch.create': { method: 'post', path: '/cdn/prefetches' },
    'prefetch.tokens': { method: 'get', path: '/cdn/prefetches/prefetchTokens' },
    // Annotations
    'annotation.create': { method: 'post', path: '/cdn/annotations' },
    'annotation.list': { method: 'post', path: '/cdn/annotationsList' },
    'annotation.get': { method: 'get', path: '/cdn/annotations/{id}' },
    'annotation.update': { method: 'patch', path: '/cdn/annotations/{id}' },
    'annotation.delete': { method: 'delete', path: '/cdn/annotations/{id}' },
    // Reports — time-series (POST with optional filters body)
    'report.edge-bandwidth': { method: 'post', path: '/cdn/report/bandwidth' },
    'report.edge-volume': { method: 'post', path: '/cdn/report/vol' },
    'report.edge-upload-volume': { method: 'post', path: '/cdn/report/upVol' },
    'report.edge-requests': { method: 'post', path: '/cdn/report/req' },
    'report.edge-status-codes': { method: 'post', path: '/cdn/report/statusCodeDetails' },
    'report.origin-volume': { method: 'post', path: '/cdn/report/volOrigin' },
    'report.origin-requests': { method: 'post', path: '/cdn/report/reqOrigin' },
    'report.origin-status-codes': { method: 'post', path: '/cdn/report/statusCodeDetailsOrigin' },
    'report.interm-volume': { method: 'post', path: '/cdn/report/volInterm' },
    'report.cpu-time': { method: 'post', path: '/cdn/report/cpuTime' },
    'report.origin-fast-route-requests': { method: 'post', path: '/cdn/report/fastOriginReq' },
    'report.origin-fast-route-volume': { method: 'post', path: '/cdn/report/fastOriginVol' },
    'report.l7-volume': { method: 'post', path: '/cdn/report/volL7' },
    'report.l7-bandwidth': { method: 'post', path: '/cdn/report/bandwidthL7' },
    'report.edge-hostname-requests': { method: 'post', path: '/cdn/report/edgeHostnameReq' },
    'report.logs': { method: 'post', path: '/cdn/report/logDownload' },
    // Reports — summary
    'report.edge-bandwidth-summary': { method: 'post', path: '/cdn/report/bandwidthSummary' },
    'report.edge-volume-summary': { method: 'post', path: '/cdn/report/volSummary' },
    'report.edge-requests-summary': { method: 'post', path: '/cdn/report/reqSummary' },
    'report.edge-status-summary': { method: 'post', path: '/cdn/report/edgeStatusSummary' },
    'report.origin-status-summary': { method: 'post', path: '/cdn/report/originStatusSummary' },
    'report.cpu-summary': { method: 'post', path: '/cdn/report/cpuSummary' },
    'report.l7-volume-summary': { method: 'post', path: '/cdn/report/volL7Summary' },
    'report.l7-bandwidth-summary': { method: 'post', path: '/cdn/report/bandwidthL7Summary' },
    'report.edge-hostname-requests-summary': { method: 'post', path: '/cdn/report/edgeHostnameReqSummary' },
    // Log configs (under /cdn/report/)
    'log-config.list': { method: 'get', path: '/cdn/report/logConfigs' },
    'log-config.get': { method: 'get', path: '/cdn/report/logConfigs/{id}' },
    'log-config.create': { method: 'post', path: '/cdn/report/logConfigs' },
    'log-config.update': { method: 'patch', path: '/cdn/report/logConfigs/{id}' },
    'log-config.delete': { method: 'delete', path: '/cdn/report/logConfigs/{id}' },
    // Log aggregation points
    'log-aggregation-point.list': { method: 'get', path: '/cdn/logAggregationPoints' },
    'log-aggregation-point.get': { method: 'get', path: '/cdn/logAggregationPoints/{id}' },
    'log-aggregation-point.create': { method: 'post', path: '/cdn/logAggregationPoints' },
    'log-aggregation-point.update': { method: 'patch', path: '/cdn/logAggregationPoints/{id}' },
    'log-aggregation-point.delete': { method: 'delete', path: '/cdn/logAggregationPoints/{id}' },
    'log-aggregation-point.summary': { method: 'get', path: '/cdn/logAggregationPoints/summaryReport' },
    // Webhooks
    'webhook.list': { method: 'get', path: '/cdn/webhooks' },
    'webhook.get': { method: 'get', path: '/cdn/webhooks/{id}' },
    'webhook.create': { method: 'post', path: '/cdn/webhooks' },
    'webhook.update': { method: 'patch', path: '/cdn/webhooks/{id}' },
    'webhook.delete': { method: 'delete', path: '/cdn/webhooks/{id}' },
    // Secrets
    'secret.list': { method: 'get', path: '/cdn/secrets' },
    'secret.get': { method: 'get', path: '/cdn/secrets/{secretID}' },
    'secret.create': { method: 'post', path: '/cdn/secrets' },
    'secret.update': { method: 'patch', path: '/cdn/secrets/{secretID}' },
    'secret.delete': { method: 'delete', path: '/cdn/secrets/{secretID}' },
    // Service quotas
    'service-quota.list': { method: 'get', path: '/cdn/serviceQuotas' },
    'service-quota.get': { method: 'get', path: '/cdn/serviceQuotas/{serviceQuotaId}' },
    'service-quota.update': { method: 'patch', path: '/cdn/serviceQuotas/{serviceQuotaId}' },
    // API permissions
    'api-permission.get': { method: 'get', path: '/cdn/apiPermissions/{id}' },
    'api-permission.create': { method: 'post', path: '/cdn/apiPermissions' },
    'api-permission.update': { method: 'patch', path: '/cdn/apiPermissions/{id}' },
    'api-permission.delete': { method: 'delete', path: '/cdn/apiPermissions/{id}' },
    // Shields (read-only)
    'shield.list': { method: 'get', path: '/cdn/shields' },
    'shield.get': { method: 'get', path: '/cdn/shields/{id}' },
    // Reference / read-only lookups
    'isp.list': { method: 'get', path: '/cdn/isps' },
    'client-region.list': { method: 'get', path: '/cdn/clientRegions' },
    'staging-server.list': { method: 'get', path: '/cdn/stagingServers' },
    'public-ip.list': { method: 'get', path: '/cdn/publicIpList' },
    'origin-fast-route-ip.list': { method: 'get', path: '/cdn/originFastRouteIpList' },
    'ip-details.lookup': { method: 'post', path: '/ngadmin/ipDetails' },
    'system-config.get': { method: 'get', path: '/cdn/systemConfigs' },
    // Admin endpoints (/ngadmin/)
    'admin-customer.list': { method: 'get', path: '/ngadmin/customers' },
    'admin-customer.get': { method: 'get', path: '/ngadmin/customers/{id}' },
    'admin-customer.create': { method: 'post', path: '/ngadmin/customers' },
    'admin-customer.update': { method: 'patch', path: '/ngadmin/customers/{id}' },
    'admin-contact.list': { method: 'get', path: '/ngadmin/contacts' },
    'admin-contact.get': { method: 'get', path: '/ngadmin/contacts/{id}' },
    'admin-contact.create': { method: 'post', path: '/ngadmin/contacts' },
    'admin-contact.update': { method: 'patch', path: '/ngadmin/contacts/{id}' },
    'admin-contact.delete': { method: 'delete', path: '/ngadmin/contacts/{id}' },
    'admin-api-account.list': { method: 'get', path: '/ngadmin/apiAccounts' },
    'admin-api-account.get': { method: 'get', path: '/ngadmin/apiAccounts/{id}' },
    'admin-api-account.create': { method: 'post', path: '/ngadmin/apiAccounts' },
    'admin-api-account.update': { method: 'patch', path: '/ngadmin/apiAccounts/{id}' },
    'admin-api-account.delete': { method: 'delete', path: '/ngadmin/apiAccounts/{id}' },
    'admin-apicall.list': { method: 'get', path: '/ngadmin/apicalls' },
    'admin-apicall.get': { method: 'get', path: '/ngadmin/apicalls/{id}' },
};
/**
 * Looks up the OpenAPI path + method for a given "resource.operation" key.
 * Returns undefined if the operation is not found.
 */
function lookupOperation(resource, operation) {
    return exports.OPERATION_MAP[`${resource}.${operation}`];
}
//# sourceMappingURL=query.js.map