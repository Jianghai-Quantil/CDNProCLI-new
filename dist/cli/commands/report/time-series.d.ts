import { Command } from 'commander';
/**
 * Register a time-series report subcommand.
 *
 * @param parent  The `report` command
 * @param name    Subcommand name (e.g. "edge-bandwidth")
 * @param desc    Description shown in help
 * @param path    Full CDN Pro API path (e.g. "/cdn/report/bandwidth")
 * @param opts    Extra configuration flags
 */
export declare function registerTimeSeriesReportCommand(parent: Command, name: string, desc: string, path: string, { noScheme, noReportRange, edgeHostnameFilter }?: {
    noScheme?: boolean | undefined;
    noReportRange?: boolean | undefined;
    edgeHostnameFilter?: boolean | undefined;
}): void;
//# sourceMappingURL=time-series.d.ts.map