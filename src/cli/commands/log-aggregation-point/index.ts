import { Command } from 'commander';
import { registerLogAggregationPointListCommand } from './list';
import { registerLogAggregationPointGetCommand } from './get';
import { registerLogAggregationPointCreateCommand } from './create';
import { registerLogAggregationPointUpdateCommand } from './update';
import { registerLogAggregationPointDeleteCommand } from './delete';
import { registerLogAggregationPointSummaryCommand } from './summary';

export function registerLogAggregationPointCommands(parent: Command): void {
  const cmd = parent
    .command('log-aggregation-point')
    .description('Manage log aggregation points');

  registerLogAggregationPointListCommand(cmd);
  registerLogAggregationPointGetCommand(cmd);
  registerLogAggregationPointCreateCommand(cmd);
  registerLogAggregationPointUpdateCommand(cmd);
  registerLogAggregationPointDeleteCommand(cmd);
  registerLogAggregationPointSummaryCommand(cmd);
}
