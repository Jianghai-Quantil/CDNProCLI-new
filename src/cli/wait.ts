import ora from 'ora';
import { CliError } from './errors';
import type { OutputFormat } from './output';

export type TaskType = 'deployment' | 'purge' | 'prefetch' | 'validation';

export interface WaitOptions {
  /** Task type determines how status, progress, and terminal states are interpreted. */
  taskType: TaskType;
  /** Max wait time in seconds. */
  timeout: number;
  /** Poll frequency in seconds. */
  pollInterval: number;
  outputFormat?: OutputFormat;
}

interface TaskPollState {
  status: string;
  progressPercent: number | undefined;
  statusDetails: string | undefined;
}

function extractPollState(taskType: TaskType, task: Record<string, unknown>): TaskPollState {
  switch (taskType) {
    case 'deployment':
      return {
        status: (task['status'] as string | undefined) ?? '',
        progressPercent: undefined,
        statusDetails: (task['statusDetails'] as string | undefined),
      };
    case 'purge':
      return {
        status: (task['status'] as string | undefined) ?? '',
        progressPercent: (task['successRate'] as number | undefined),
        statusDetails: undefined,
      };
    case 'prefetch': {
      // metadata may be under 'metadata' (schema) or 'metaData' (example)
      const meta = (task['metadata'] ?? task['metaData']) as Record<string, unknown> | undefined;
      return {
        status: (meta?.['status'] as string | undefined) ?? '',
        progressPercent: (meta?.['successRate'] as number | undefined),
        statusDetails: undefined,
      };
    }
    case 'validation':
      return {
        status: (task['status'] as string | undefined) ?? '',
        progressPercent: undefined,
        statusDetails: (task['statusDetails'] as string | undefined),
      };
  }
}

/**
 * Returns 'success' | 'failure' if the task reached a terminal state, or null if still running.
 */
function resolveTerminal(taskType: TaskType, state: TaskPollState): 'success' | 'failure' | null {
  switch (taskType) {
    case 'deployment':
    case 'validation':
      if (state.status === 'succeeded') return 'success';
      if (state.status === 'failed') return 'failure';
      return null;
    case 'purge':
    case 'prefetch':
      // Purge and prefetch only have one terminal state: 'finished'
      if (state.status === 'finished') return 'success';
      return null;
  }
}

/**
 * Poll a task until it reaches a terminal state or the timeout is exceeded.
 *
 * In interactive TTY mode (table output): shows an ora spinner with live status text.
 * In non-interactive / JSON mode: emits one NDJSON line per poll plus a final "done" line.
 *
 * On failure (deployment / validation), the error message includes {@code statusDetails}
 * from the API response.
 *
 * @param getTask  A function that resolves the current task state given the task ID.
 * @param taskId   The task identifier returned by the create call.
 * @param opts     Task type, timeout, poll interval, and output format.
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
    const state = extractPollState(opts.taskType, task);
    const resolution = resolveTerminal(opts.taskType, state);

    if (resolution === 'success') {
      if (isInteractive) {
        spinner!.succeed(`Task ${taskId} completed`);
      } else {
        process.stdout.write(
          JSON.stringify({ event: 'done', taskId, data: task }) + '\n',
        );
      }
      return task;
    }

    if (resolution === 'failure') {
      const reason = state.statusDetails ?? 'unknown reason';
      if (isInteractive) {
        spinner!.fail(`Task ${taskId} failed: ${reason}`);
      }
      throw new CliError('ERROR', `Task ${taskId} failed: ${reason}`, task);
    }

    // Non-terminal state — update spinner or emit poll event
    const progressText =
      state.progressPercent != null ? ` ${state.progressPercent}%` : '';
    if (isInteractive) {
      spinner!.text = `Task ${taskId}: ${state.status}${progressText}`;
    } else {
      process.stdout.write(
        JSON.stringify({
          event: 'poll',
          taskId,
          status: state.status,
          progressPercent: state.progressPercent,
        }) + '\n',
      );
    }

    await new Promise<void>((resolve) => setTimeout(resolve, opts.pollInterval * 1000));
  }

  if (spinner) spinner.fail(`Task ${taskId} timed out after ${opts.timeout}s`);
  throw new CliError('TIMEOUT', `Task ${taskId} did not complete within ${opts.timeout}s`);
}
