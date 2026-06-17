import { Module } from '@nestjs/common';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { BillingRepository } from './billing.repository';
import { RecurrenceSkipRepository } from 'src/common/repositories/recurrence-skip.repository';
import { EventHub } from 'src/common/patterns/event-hub';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BillingsController],
  providers: [
    BillingsService,
    BillingRepository,
    { provide: 'BILLING_REPOSITORY', useClass: BillingRepository },
    { provide: 'SKIP_REPOSITORY', useClass: RecurrenceSkipRepository },
    EventHub,
  ],
  exports: [BillingsService],
})
export class BillingsModule {}
