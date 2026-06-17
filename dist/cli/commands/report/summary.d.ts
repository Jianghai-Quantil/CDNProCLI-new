import { Command } from 'commander';
/**
 * Register a summary report subcommand (no --type, no --report-range, adds --group-by).
 */
export declare function registerSummaryReportCommand(parent: Command, name: string, desc: string, path: string, { noScheme, edgeHostnameFilter }?: {
    noScheme?: boolean | undefined;
    edgeHostnameFilter?: boolean | undefined;
}): void;
//# sourceMappingURL=summary.d.ts.map