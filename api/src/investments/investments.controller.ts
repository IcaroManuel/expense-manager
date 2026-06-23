import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import {
  InvestmentsService,
  type SnapshotCreate,
  type TransactionCreate,
} from './investments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: any) {
    return this.investmentsService.getSummary(user.id);
  }

  @Get('yield-history')
  async getYieldHistory(@CurrentUser() user: any) {
    return this.investmentsService.getYieldHistory(user.id);
  }

  @Post('snapshots')
  @HttpCode(201)
  async createSnapshot(@Body() payload: SnapshotCreate, @CurrentUser() user: any) {
    return this.investmentsService.createSnapshot(user.id, payload);
  }

  @Get('transactions')
  async listTransactions(@CurrentUser() user: any) {
    return this.investmentsService.listTransactions(user.id);
  }

  @Post('transactions')
  @HttpCode(201)
  async createTransaction(@Body() payload: TransactionCreate, @CurrentUser() user: any) {
    return this.investmentsService.createTransaction(user.id, payload);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  async deleteTransaction(@Param('id') id: string, @CurrentUser() user: any) {
    const ok = await this.investmentsService.deleteTransaction(user.id, id);
    if (!ok) {
      throw new NotFoundException('Transaction not found');
    }
  }
}
