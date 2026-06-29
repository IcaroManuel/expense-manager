import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NfseService } from './nfse.service';

@Module({
  imports: [PrismaModule],
  providers: [NfseService],
  exports: [NfseService],
})
export class NfseModule {}
