import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { BillingsModule } from 'src/billings/billings.module';
import { AuthModule } from 'src/auth/auth.module';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [AuthModule, BillingsModule, ExpensesModule, CategoriesModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
