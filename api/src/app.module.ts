import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BillingsModule } from './billings/billings.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SummaryModule } from './summary/summary.module';
import { InvestmentsModule } from './investments/investments.module';
import { NfseModule } from './nfse/nfse.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BillingsModule,
    ExpensesModule,
    SummaryModule,
    InvestmentsModule,
    NfseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
