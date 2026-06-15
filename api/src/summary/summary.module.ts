import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { BillingsModule } from 'src/billings/billings.module';

@Module({
  imports: [BillingsModule, ExpensesModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
