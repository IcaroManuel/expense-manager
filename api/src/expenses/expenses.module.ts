import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpenseRepository } from './expense.repository';
import { RecurrenceSkipRepository } from 'src/common/repositories/recurrence-skip.repository';
import { EventHub } from 'src/common/patterns/event-hub';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    ExpenseRepository,
    { provide: 'EXPENSE_REPOSITORY', useClass: ExpenseRepository },
    { provide: 'SKIP_REPOSITORY', useClass: RecurrenceSkipRepository },
    EventHub,
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
