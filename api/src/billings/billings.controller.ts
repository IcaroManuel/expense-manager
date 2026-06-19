import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  BillingsService,
  type BillingCreate,
  type BillingUpdate,
} from './billings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/billings')
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  @Get()
  async listBillings(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser() user: any,
  ) {
    return this.billingsService.listForMonth(user.id, year, month);
  }

  @Post()
  async createBilling(
    @Body() payload: BillingCreate,
    @CurrentUser() user: any,
  ) {
    return this.billingsService.create(user.id, payload);
  }

  @Patch(':id')
  async updateBilling(
    @Param('id') id: string,
    @Body() payload: BillingUpdate,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser() user: any,
  ) {
    const updated = await this.billingsService.update(
      user.id,
      id,
      payload,
      year,
      month,
    );
    if (!updated) {
      throw new NotFoundException('Billing not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBilling(
    @Param('id') id: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('scope') scope: string = 'month',
    @CurrentUser() user: any,
  ) {
    let ok = false;
    if (scope === 'all') {
      ok = await this.billingsService.deleteTemplate(user.id, id);
    } else {
      ok = await this.billingsService.deleteForMonth(user.id, id, year, month);
    }

    if (!ok) {
      throw new NotFoundException('Billing not found');
    }
  }
}
