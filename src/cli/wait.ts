import ora from 'ora';
import { CliError } from './errors';
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
export async function waitForTask(
  getTask: (id: string) => Promise<unknown>,
  taskId: string,
  opts: WaitOptions,
): Promise<unknown> {
  const deadline = Date.now() + opts.timeout * 1000;
  const isInteractive =
    process.stdout.isTTY &&
    opts.outputFormat !== 'json' &&
    opts.outputFormat !== 'jsonl';

  const spinner = isInteractive ? ora(`Waiting for task ${taskId}…`).start() : null;

  while (Date.now() < deadline) {
    const task = (await getTask(taskId)) as Record<string, unknown>;
    const status = (task['status'] as string | undefined) ?? '';
    const pct = (task['progressPercent'] as number | undefined) ?? 0;

    if (status === 'succeeded') {
      if (isInteractive) {
        spinner!.succeed(`Task ${taskId} completed`);
      } else {
        process.stdout.write(
          JSON.stringify({ event: 'done', taskId, data: task }) + '\n',
        );
      }
      return task;
    }

    if (status === 'failed') {
      const reason = (task['failReason'] as string | undefined) ?? 'unknown reason';
      if (isInteractive) {
        spinner!.fail(`Task ${taskId} failed: ${reason}`);
      }
      throw new CliError('ERROR', `Task ${taskId} failed: ${reason}`, task);
    }

    // Non-terminal state — update spinner or emit poll event
    if (isInteractive) {
      spinner!.text = `Task ${taskId}: ${status}${pct > 0 ? ` ${pct}%` : ''}`;
    } else {
      process.stdout.write(
        JSON.stringify({ event: 'poll', taskId, status, progressPercent: pct }) + '\n',
      );
    }

    await new Promise<void>((resolve) => setTimeout(resolve, opts.pollInterval * 1000));
  }

  if (spinner) spinner.fail(`Task ${taskId} timed out after ${opts.timeout}s`);
  throw new CliError('TIMEOUT', `Task ${taskId} did not complete within ${opts.timeout}s`);
}
