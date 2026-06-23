import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { BalanceSnapshotRepository } from './balance-snapshot.repository';
import { InvestmentTransactionRepository } from './investment-transaction.repository';
import { EventHub } from 'src/common/patterns/event-hub';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InvestmentsController],
  providers: [
    InvestmentsService,
    BalanceSnapshotRepository,
    InvestmentTransactionRepository,
    { provide: 'SNAPSHOT_REPOSITORY', useClass: BalanceSnapshotRepository },
    { provide: 'TRANSACTION_REPOSITORY', useClass: InvestmentTransactionRepository },
    EventHub,
  ],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
