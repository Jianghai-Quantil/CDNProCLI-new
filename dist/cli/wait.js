"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForTask = waitForTask;
const ora_1 = __importDefault(require("ora"));
const errors_1 = require("./errors");
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
async function waitForTask(getTask, taskId, opts) {
    const deadline = Date.now() + opts.timeout * 1000;
    const isInteractive = process.stdout.isTTY &&
        opts.outputFormat !== 'json' &&
        opts.outputFormat !== 'jsonl';
    const spinner = isInteractive ? (0, ora_1.default)(`Waiting for task ${taskId}…`).start() : null;
    while (Date.now() < deadline) {
        const task = (await getTask(taskId));
        const status = task['status'] ?? '';
        const pct = task['progressPercent'] ?? 0;
        if (status === 'succeeded') {
            if (isInteractive) {
                spinner.succeed(`Task ${taskId} completed`);
            }
            else {
                process.stdout.write(JSON.stringify({ event: 'done', taskId, data: task }) + '\n');
            }
            return task;
        }
        if (status === 'failed') {
            const reason = task['failReason'] ?? 'unknown reason';
            if (isInteractive) {
                spinner.fail(`Task ${taskId} failed: ${reason}`);
            }
            throw new errors_1.CliError('ERROR', `Task ${taskId} failed: ${reason}`, task);
        }
        // Non-terminal state — update spinner or emit poll event
        if (isInteractive) {
            spinner.text = `Task ${taskId}: ${status}${pct > 0 ? ` ${pct}%` : ''}`;
        }
        else {
            process.stdout.write(JSON.stringify({ event: 'poll', taskId, status, progressPercent: pct }) + '\n');
        }
        await new Promise((resolve) => setTimeout(resolve, opts.pollInterval * 1000));
    }
    if (spinner)
        spinner.fail(`Task ${taskId} timed out after ${opts.timeout}s`);
    throw new errors_1.CliError('TIMEOUT', `Task ${taskId} did not complete within ${opts.timeout}s`);
}
//# sourceMappingURL=wait.js.map