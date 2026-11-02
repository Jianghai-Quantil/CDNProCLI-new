/**
 * update-check-worker.ts — runs detached from the CLI (see scheduleUpdateCheck
 * in updater.ts). Fetches the latest published version and caches it so the
 * next interactive run can show an update notice. Never prints anything.
 */
import { runUpdateCheckWorker } from './updater';

runUpdateCheckWorker().finally(() => process.exit(0));
