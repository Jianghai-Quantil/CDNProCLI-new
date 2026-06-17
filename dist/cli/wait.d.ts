import type { OutputFormat } from './output';
export interface WaitOptions {
    /** Max wait time in seconds. Default varies by task type: 600 (deploy/purge/prefetch), 300 (validation). */
    timeout: number;
    /** Poll frequency in seconds. Default varies by task type: 30 (deploy/purge/prefetch), 10 (validation). */
    pollInterval: number;
    outputFormat?: OutputFormat;
}
/**
 * Poll a task until it reaches a terminal state (succeeded/failed) or the timeout is exceeded.
 *
 * In interactive TTY mode (table output): shows an ora spinner with live status text.
 * In non-interactive / JSON mode: emits one NDJSON line per poll plus a final "done" line.
 *
 * @param getTask  A function that resolves the current task state given the task ID.
 * @param taskId   The task identifier returned by the create call.
 * @param opts     Timeout, poll interval, and output format.
 * @returns        The final task object when the task succeeds.
 * @throws         CliError('ERROR')   if the task fails.
 * @throws         CliError('TIMEOUT') if the deadline is reached before a terminal state.
 */
export declare function waitForTask(getTask: (id: string) => Promise<unknown>, taskId: string, opts: WaitOptions): Promise<unknown>;
//# sourceMappingURL=wait.d.ts.map